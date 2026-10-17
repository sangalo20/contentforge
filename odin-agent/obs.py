"""Observability for Odin: structured Cloud Logging + business events.

On Cloud Run (K_SERVICE set) every log record is emitted as single-line JSON:
`severity` drives the entry severity in Cloud Logging, and
`logging.googleapis.com/trace` groups a request's log lines under its request
log in Logs Explorer. Locally, logs stay as plain readable console output.

Business events carry structured, queryable fields:
    event("campaign.completed", draftChars=..., heimdallMs=...)
→ in Logs Explorer: jsonPayload.event="campaign.completed"
"""

import contextvars
import json
import logging
import os
import time

ON_CLOUD_RUN = bool(os.getenv("K_SERVICE"))
PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCP_PROJECT_ID") or ""

# Per-request context (trace id, calling user) set by the FastAPI middleware.
request_ctx = contextvars.ContextVar("request_ctx", default=None)

_SEVERITY = {
    logging.DEBUG: "DEBUG",
    logging.INFO: "INFO",
    logging.WARNING: "WARNING",
    logging.ERROR: "ERROR",
    logging.CRITICAL: "CRITICAL",
}


class CloudJsonFormatter(logging.Formatter):
    def format(self, record):
        entry = {
            "severity": _SEVERITY.get(record.levelno, "INFO"),
            "message": record.getMessage(),
            "logger": record.name,
        }
        if record.exc_info:
            entry["message"] += "\n" + self.formatException(record.exc_info)
        ctx = request_ctx.get()
        if ctx:
            if ctx.get("trace"):
                entry["logging.googleapis.com/trace"] = ctx["trace"]
            if ctx.get("uid"):
                entry["uid"] = ctx["uid"]
        fields = getattr(record, "fields", None)
        if fields:
            entry.update(fields)
        return json.dumps(entry, default=str)


def setup_logging():
    """Route ALL loggers (agents, uvicorn, litellm) through one formatter."""
    root = logging.getLogger()
    level = getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)
    root.setLevel(level)

    if ON_CLOUD_RUN:
        handler = logging.StreamHandler()
        handler.setFormatter(CloudJsonFormatter())
        root.handlers = [handler]
        # Collapse uvicorn's own handlers into the root JSON pipeline.
        for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
            lg = logging.getLogger(name)
            lg.handlers = []
            lg.propagate = True
    elif not root.handlers:
        logging.basicConfig(level=level)


_event_logger = logging.getLogger("events")


def event(name: str, **fields):
    """Emit a business event with structured fields (INFO severity)."""
    _event_logger.info(name, extra={"fields": {"event": name, **fields}})


def install_request_logging(app):
    """FastAPI middleware: trace/user context for all logs in the request,
    plus one summary line per request (method, path, status, latency)."""
    from starlette.requests import Request

    logger = logging.getLogger("http")

    @app.middleware("http")
    async def _request_logging(request: Request, call_next):
        trace_header = request.headers.get("x-cloud-trace-context")
        trace = (
            f"projects/{PROJECT_ID}/traces/{trace_header.split('/')[0]}"
            if trace_header and PROJECT_ID
            else None
        )
        uid = request.headers.get("x-user-id") or None
        token = request_ctx.set({
            "trace": trace,
            "uid": uid,
            # Attribution for usage/cost records, forwarded by the backend.
            "workspaceId": request.headers.get("x-workspace-id") or None,
            "itemId": request.headers.get("x-item-id") or None,
        })
        started = time.monotonic()
        status = 500
        try:
            response = await call_next(request)
            status = response.status_code
            return response
        finally:
            request_ctx.reset(token)
            path = request.url.path
            if path not in ("/", "/healthz", "/healthz/ready"):
                level = logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO
                logger.log(level, f"{request.method} {path} {status}", extra={"fields": {
                    "httpRequest": {
                        "requestMethod": request.method,
                        "requestUrl": path,
                        "status": status,
                        "latency": f"{time.monotonic() - started:.3f}s",
                    },
                    "uid": uid,
                    **({"logging.googleapis.com/trace": trace} if trace else {}),
                }})
