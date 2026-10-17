import logging
import os
from dotenv import load_dotenv
load_dotenv()

# Structured logging must be configured before any module creates loggers.
from obs import setup_logging, install_request_logging, event
setup_logging()

# AI usage/cost tracking: one record per LLM call via litellm's callback.
from usage import init_usage_tracking
init_usage_tracking()

from fastapi import FastAPI, Request, HTTPException, Depends
from pydantic import BaseModel
from jarviscore.integrations.fastapi import JarvisLifespan
from jarviscore.integrations import create_chat_router
from agents import OdinAgent, HermesAgent, LokiAgent, OscarAgent, HeimdallAgent, MimirAgent, HuginnAgent, PeerMessage, _friendly_llm_error
from auth import get_forwarded_user

# Initialize the agents we need module-level handles to.
odin = OdinAgent()
hermes = HermesAgent()
loki = LokiAgent()
mimir = MimirAgent()
huginn = HuginnAgent()

class MockKernelOutput:
    def __init__(self, status, summary, payload, metadata):
        self.status = status
        self.summary = summary
        self.payload = payload
        self.metadata = metadata

class KernelProxy:
    async def execute(self, task, system_prompt, context, agent_id):
        msg = PeerMessage({
            "task": "chat",
            "message": task,
            "system_prompt": system_prompt,
            "context": context
        })
        result = await odin.on_peer_request(msg)
        status = result.get("status", "success" if "error" not in result else "failure")
        summary = result.get("answer") or result.get("url") or str(result)
        # The chat router's response schema has no image field, so we embed the
        # generated image URL in the answer; the frontend extracts and strips it.
        image_url = result.get("imageUrl")
        if image_url:
            summary = f"{summary}\n\n{image_url}".strip()
        return MockKernelOutput(status=status, summary=summary, payload=None, metadata={})

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json

# Initialize the application with the JarvisCore lifespan
# This automatically sets up the AgentMesh and initializes all agents in P2P mode
app = FastAPI(
    title="Odin Agent Service",
    description="Standalone multi-agent ideation and orchestration service.",
    version="1.0.0",
    lifespan=JarvisLifespan([odin, OscarAgent(), hermes, loki, mimir, huginn, HeimdallAgent()], mode="p2p")
)

# Trace-correlated request logging: one structured summary line per request.
install_request_logging(app)

# Enable CORS for frontend integration. A credentialed wildcard ("*") is both
# invalid per the CORS spec and unsafe, so we use an explicit allowlist from the
# ALLOWED_ORIGINS env var (comma-separated), defaulting to local dev.
_allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5193").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the Jarviscore Chat Router (routes chat to the Odin agent).
# The router-level dependency reads the forwarded end-user identity. Caller
# authentication is handled by Cloud Run IAM (Odin is backend-only).
app.include_router(
    create_chat_router(kernel=KernelProxy()),
    prefix="/api/v1",
    dependencies=[Depends(get_forwarded_user)],
)

class ChatStreamRequest(BaseModel):
    message: str
    system_prompt: str | None = None
    workflow_id: str | None = None
    agent_id: str | None = "odin"
    context: dict | None = None


@app.post("/api/v1/chat/stream")
async def chat_stream(req: ChatStreamRequest, user: dict = Depends(get_forwarded_user)):
    """
    Streams Odin's reply as Server-Sent Events (SSE).

    Event payloads (one JSON object per SSE `data:` line):
      {"type": "text",   "content": "..."}   incremental answer tokens
      {"type": "status", "content": "..."}   delegation / progress notices
      {"type": "image",  "url": "..."}        generated cover image
      {"type": "error",  "content": "..."}    failures
    """
    async def event_generator():
        try:
            peer_msg = PeerMessage({
                "task": "chat",
                "message": req.message,
                "system_prompt": req.system_prompt or "",
                "context": req.context or {},
            })
            async for event in odin.stream_chat(peer_msg):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

class CampaignRequest(BaseModel):
    transcript: str
    systemPrompt: str | None = None
    description: str | None = None
    wordCount: str | None = None
    aiProvider: str | None = None
    aiModel: str | None = None
    sourceCount: int = 1
    sourceTypes: list[str] | None = None
    brief: dict | None = None
    # {title, url} candidates for internal links (published articles).
    internalLinks: list[dict] | None = None

@app.get("/")
def read_root():
    return {"message": "Odin Agent Service is running"}


@app.get("/healthz")
def healthz():
    """Liveness — cheap, no dependencies touched."""
    return {"status": "ok"}


@app.get("/healthz/ready")
def healthz_ready(request: Request):
    """Readiness for monitoring: verifies every agent is registered in the
    mesh and reports render-storage configuration. 503 when degraded."""
    from fastapi.responses import JSONResponse
    mesh = getattr(request.app.state, "jarvis_mesh", None)
    # Mesh lookups are by ROLE; Hermes registers as "designer".
    agents = {
        label: bool(mesh and mesh.get_agent(role))
        for label, role in (
            ("odin", "odin"), ("oscar", "oscar"), ("heimdall", "heimdall"),
            ("hermes", "designer"), ("loki", "loki"), ("mimir", "mimir"), ("huginn", "huginn"),
        )
    }
    healthy = all(agents.values())
    return JSONResponse(
        {
            "status": "ok" if healthy else "degraded",
            "agents": agents,
            "rendersBucket": os.getenv("RENDERS_BUCKET") or None,
            "revision": os.getenv("K_REVISION", "local"),
        },
        status_code=200 if healthy else 503,
    )

@app.post("/api/v1/tasks/generate-campaign")
async def generate_campaign(req: CampaignRequest, request: Request, user: dict = Depends(get_forwarded_user)):
    """
    Main endpoint for generating a content campaign from a transcript.
    Delegates the work to the Odin agent in the mesh.
    """
    try:
        # Retrieve the mesh from the FastAPI app state (injected by JarvisLifespan)
        mesh = getattr(request.app.state, "jarvis_mesh", None)
        if not mesh:
            raise HTTPException(status_code=500, detail="Agent mesh not initialized.")
            
        odin = mesh.get_agent("odin")
        if not odin:
            raise HTTPException(status_code=500, detail="Odin agent not found in mesh.")
            
        # Execute the main campaign generation workflow
        result = await odin.process_campaign(
            transcript=req.transcript,
            system_prompt=req.systemPrompt,
            description=req.description,
            word_count=req.wordCount,
            ai_provider=req.aiProvider,
            ai_model=req.aiModel,
            source_count=req.sourceCount,
            source_types=req.sourceTypes,
            brief=req.brief,
            internal_links=req.internalLinks
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return {
            "status": "success",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/tasks/generate-campaign/stream")
async def generate_campaign_stream(req: CampaignRequest, request: Request, user: dict = Depends(get_forwarded_user)):
    """
    Streaming variant of generate-campaign: emits NDJSON progress events as the
    pipeline moves between agents (oscar_start/oscar_done/heimdall_start/...),
    followed by a final {"type": "result"} line carrying the campaign payload.
    """
    import asyncio

    mesh = getattr(request.app.state, "jarvis_mesh", None)
    if not mesh:
        raise HTTPException(status_code=500, detail="Agent mesh not initialized.")

    odin = mesh.get_agent("odin")
    if not odin:
        raise HTTPException(status_code=500, detail="Odin agent not found in mesh.")

    async def event_generator():
        queue: asyncio.Queue = asyncio.Queue()

        async def progress(event: str):
            await queue.put({"type": "stage", "event": event})

        async def run():
            try:
                result = await odin.process_campaign(
                    transcript=req.transcript,
                    system_prompt=req.systemPrompt,
                    description=req.description,
                    word_count=req.wordCount,
                    ai_provider=req.aiProvider,
                    ai_model=req.aiModel,
                    source_count=req.sourceCount,
                    source_types=req.sourceTypes,
                    brief=req.brief,
                    internal_links=req.internalLinks,
                    progress=progress,
                )
                if "error" in result:
                    await queue.put({"type": "error", "detail": result["error"]})
                else:
                    await queue.put({"type": "result", "data": result})
            except Exception as e:
                await queue.put({"type": "error", "detail": str(e)})
            finally:
                await queue.put(None)

        task = asyncio.create_task(run())
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


class SyndicateRequest(BaseModel):
    draft: str
    channel: str = "linkedin"
    personaPrompt: str | None = None
    function: str | None = "teach"
    format: str | None = None
    brandName: str | None = None
    accentColor: str | None = None
    template: str | None = None
    # What `draft` holds: "article" (syndicate an approved article) or "idea"
    # (develop a creator's original idea brief). Changes Loki's prompt framing.
    sourceType: str | None = "article"
    # When true, carousel/poster runs return CONTENT only (no render): the human
    # reviews and approves first; the caller renders later via /carousel/render.
    draftOnly: bool = False


@app.post("/api/v1/tasks/syndicate")
async def syndicate(req: SyndicateRequest, request: Request, user: dict = Depends(get_forwarded_user)):
    """
    Turn an approved article draft into platform-native social copy.
    Delegates to the Loki agent in the mesh.
    """
    try:
        mesh = getattr(request.app.state, "jarvis_mesh", None)
        if not mesh:
            raise HTTPException(status_code=500, detail="Agent mesh not initialized.")

        loki = mesh.get_agent("loki")
        if not loki:
            raise HTTPException(status_code=500, detail="Loki agent not found in mesh.")

        result = await loki.on_peer_request(PeerMessage({
            "task": "generate_social_copy",
            "draft": req.draft,
            "source_type": req.sourceType,
            "channel": req.channel,
            "persona_prompt": req.personaPrompt,
            "function": req.function,
            "format": req.format,
            "brand_name": req.brandName,
            "accent_color": req.accentColor,
            "template": req.template,
            "draft_only": req.draftOnly,
        }))

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "status": "success",
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class StudioChatRequest(BaseModel):
    message: str
    kind: str = "carousel"  # "carousel" | "poster"
    content: dict
    channel: str = "linkedin"
    draft: str | None = None
    # "article" or "idea" — what the grounding text in `draft` is.
    sourceType: str | None = "article"
    personaPrompt: str | None = None
    function: str | None = "teach"
    # Athena recall block assembled by the ContentForge backend.
    memory: str | None = None
    context: dict | None = None


@app.post("/api/v1/studio/chat/stream")
async def studio_chat_stream(req: StudioChatRequest, user: dict = Depends(get_forwarded_user)):
    """
    Streams a live studio session with Loki as Server-Sent Events (SSE): the
    reviewer discusses a drafted carousel/poster and Loki pushes revisions to
    the canvas.

    Event payloads (one JSON object per SSE `data:` line):
      {"type": "text",    "content": "..."}   incremental reply tokens
      {"type": "status",  "content": "..."}   progress notices
      {"type": "content", "content": {...}}    revised canvas content
      {"type": "reset"}                        discard the reply streamed so far
                                               (model failover; a retry follows)
      {"type": "error",   "content": "..."}   failures (human-readable)
    """
    async def event_generator():
        try:
            peer_msg = PeerMessage({
                "task": "studio_chat",
                "message": req.message,
                "kind": req.kind,
                "content": req.content,
                "channel": req.channel,
                "draft": req.draft,
                "source_type": req.sourceType,
                "persona_prompt": req.personaPrompt,
                "function": req.function,
                "memory": req.memory,
                "context": req.context or {},
            })
            async for event in loki.stream_studio_chat(peer_msg):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logging.getLogger("studio").error(f"Studio stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': _friendly_llm_error(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


class VaultGistRequest(BaseModel):
    entries: list[dict]


@app.post("/api/v1/vault/gist")
async def vault_gist(req: VaultGistRequest, user: dict = Depends(get_forwarded_user)):
    """Distill 1-10 vault entries ({id, title, text}) into scouting gists +
    topic tags. Non-streaming; ContentForge calls this at stage/sync/import."""
    if not req.entries or len(req.entries) > 10:
        raise HTTPException(status_code=400, detail="Provide 1-10 entries.")
    try:
        return {"gists": await mimir.summarize_entries(req.entries)}
    except Exception as e:
        logging.getLogger("gist").error(f"Vault gist failed: {e}")
        raise HTTPException(status_code=502, detail=_friendly_llm_error(e))


class VaultScoutRequest(BaseModel):
    message: str
    workspaceName: str | None = None
    personaPrompt: str | None = None
    vaultDigest: list[dict] | None = None
    recentContent: list[str] | None = None
    # Athena recall block assembled by the ContentForge backend.
    memory: str | None = None
    context: dict | None = None


@app.post("/api/v1/vault/scout/stream")
async def vault_scout_stream(req: VaultScoutRequest, user: dict = Depends(get_forwarded_user)):
    """
    Streams a Source Vault scouting session with Mimir as SSE: the operator
    converses over the vault digest to pick transcripts for the next piece.

    Event payloads (one JSON object per SSE `data:` line):
      {"type": "text",      "content": "..."}   incremental reply tokens
      {"type": "proposal",  "content": {picks, angle, workingTitle}}
      {"type": "tool_call", "content": {id, name: "read_transcript", vaultId}}
                            — the caller executes the read and re-invokes this
                            endpoint with the tool round-trip in context.history
                            and an empty message
      {"type": "error",     "content": "..."}   failures (human-readable)
    """
    async def event_generator():
        try:
            peer_msg = PeerMessage({
                "task": "vault_scout",
                "message": req.message,
                "workspace_name": req.workspaceName,
                "persona_prompt": req.personaPrompt,
                "vault_digest": req.vaultDigest or [],
                "recent_content": req.recentContent or [],
                "memory": req.memory,
                "context": req.context or {},
            })
            async for event in mimir.stream_scout_chat(peer_msg):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logging.getLogger("scout").error(f"Vault scout stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'content': _friendly_llm_error(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


class ReviseSocialRequest(BaseModel):
    kind: str  # "carousel" | "poster"
    content: dict
    channel: str = "linkedin"
    note: str | None = None
    slideIndex: int | None = None
    draft: str | None = None
    # "article" or "idea" — what the grounding text in `draft` is.
    sourceType: str | None = "article"
    personaPrompt: str | None = None
    function: str | None = "teach"


@app.post("/api/v1/tasks/revise-social")
async def revise_social(req: ReviseSocialRequest, request: Request, user: dict = Depends(get_forwarded_user)):
    """
    Revise an already-drafted carousel or poster during human review, steered by
    the reviewer's note. Delegates to Loki; returns content only (no render).
    """
    try:
        mesh = getattr(request.app.state, "jarvis_mesh", None)
        if not mesh:
            raise HTTPException(status_code=500, detail="Agent mesh not initialized.")

        loki = mesh.get_agent("loki")
        if not loki:
            raise HTTPException(status_code=500, detail="Loki agent not found in mesh.")

        result = await loki.on_peer_request(PeerMessage({
            "task": "revise_social",
            "kind": req.kind,
            "content": req.content,
            "channel": req.channel,
            "note": req.note,
            "slide_index": req.slideIndex,
            "draft": req.draft,
            "source_type": req.sourceType,
            "persona_prompt": req.personaPrompt,
            "function": req.function,
        }))

        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])

        return {
            "status": "success",
            "data": result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/carousel/templates")
def carousel_templates(user: dict = Depends(get_forwarded_user)):
    """List the available carousel brand templates (id, name, description)."""
    from carousel_pdf import list_templates
    return {"templates": list_templates()}


class RenderCarouselRequest(BaseModel):
    slides: list[dict]
    brandName: str | None = None
    template: str | None = "devfest"


@app.post("/api/v1/carousel/render")
def render_carousel(req: RenderCarouselRequest, user: dict = Depends(get_forwarded_user)):
    """Render a carousel PDF from already-generated slides (deterministic re-render).

    Lets the caller reproduce a durable PDF from persisted slides + template, so
    the file never needs to be stored permanently.
    """
    from carousel_pdf import render_carousel_pdf
    if not req.slides:
        raise HTTPException(status_code=400, detail="No slides provided.")
    file_id, _path = render_carousel_pdf(
        req.slides, req.brandName or "", "", req.template or "devfest"
    )
    return {"status": "success", "file_id": file_id}


class RenderPosterRequest(BaseModel):
    content: dict
    brandName: str | None = None
    template: str | None = "devfest"


@app.post("/api/v1/poster/render")
def render_poster_endpoint(req: RenderPosterRequest, user: dict = Depends(get_forwarded_user)):
    """Render a poster PNG from already-generated content (deterministic re-render)."""
    from carousel_pdf import render_poster
    if not req.content:
        raise HTTPException(status_code=400, detail="No poster content provided.")
    file_id, _path = render_poster(req.content, req.brandName or "", "", req.template or "devfest")
    return {"status": "success", "file_id": file_id}


@app.get("/api/v1/reports/poster/{file_id}")
def download_poster(file_id: str, user: dict = Depends(get_forwarded_user)):
    """Serve a rendered poster PNG by its file_id (GCS when configured, else temp dir)."""
    import re as _re
    from fastapi.responses import Response
    from render_store import fetch as _fetch_render

    if not _re.match(r"^[a-f0-9]{6,12}$", file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID format.")
    found = _fetch_render(file_id, ".png")
    if not found:
        raise HTTPException(status_code=404, detail="Poster not found or has expired.")
    filename, content = found
    return Response(
        content,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/v1/reports/carousel/{file_id}")
def download_carousel(file_id: str, user: dict = Depends(get_forwarded_user)):
    """Serve a Loki-generated carousel PDF by its file_id.

    Strict id validation (path-traversal guard), then fetch from the render
    store — GCS when configured (any-instance downloads), else the temp dir.
    """
    import re as _re
    from fastapi.responses import Response
    from render_store import fetch as _fetch_render

    if not _re.match(r"^[a-f0-9]{6,12}$", file_id):
        raise HTTPException(status_code=400, detail="Invalid file ID format.")

    found = _fetch_render(file_id, ".pdf")
    if not found:
        raise HTTPException(status_code=404, detail="Carousel not found or has expired.")

    filename, content = found
    return Response(
        content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

