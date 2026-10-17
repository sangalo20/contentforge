import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Copy, Share2, Loader2, Image, FileText, Clock, ChevronDown, Download, Check, X, Settings2, Activity, ExternalLink, RefreshCw, Eye, Pencil, RotateCcw, Bot, Plus, Trash2, UserCheck, Lightbulb } from "lucide-react";
import { FaLinkedin, FaXTwitter, FaInstagram, FaFacebook, FaTiktok } from "react-icons/fa6";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select } from "../components/ui/select";
import { authFetch, API_BASE } from "../lib/api";
import StudioChat from "../components/StudioChat";
import ImageChatModal from "../components/ImageChatModal";
import SubmitReviewModal from "../components/SubmitReviewModal";
import { useAuth } from "../context/useAuth";
import { toPng, toJpeg } from "html-to-image";
import SocialPosterCanvas from "../brand-studio/SocialPosterCanvas";
import { posterDesigns, POSTER_W } from "../brand-studio/socialPosterDesigns";
import SocialCarouselCanvas from "../brand-studio/SocialCarouselCanvas";
import { CAROUSEL_DESIGNS, SLIDE_W, SLIDE_H } from "../brand-studio/socialCarouselDesigns";

function getArticleTitle(item) {
  if (!item) return null;
  if (item.draft) {
    const match = item.draft.match(/^(?:#+)\s+(.+?)(?:\n|$)/m);
    if (match) return match[1].replace(/(\*\*|\*)/g, '').trim();
  }
  if (item.titles && item.titles.length > 0) return item.titles.join(' + ');
  if (item.title) return item.title;
  return 'Untitled Article';
}

// System-level social functions (mirrors SOCIAL_FUNCTIONS in the Odin agent).
// The JOB of the post drives the angle and the CTA.
const SOCIAL_FUNCTIONS = [
  { id: 'teach', label: 'Teach', hint: 'Give one useful takeaway. Soft or no CTA.' },
  { id: 'sell', label: 'Sell', hint: 'Drive to the funnel. One clear, soft CTA.' },
  { id: 'entertain', label: 'Entertain', hint: 'Earn attention with a story or observation.' },
  { id: 'inspire', label: 'Inspire', hint: 'Land a firm, resonant takeaway.' },
];

// Live-activity stages shown on the right panel while generating. These mirror the
// real backend pipeline (see /api/generate-socials -> Odin -> Loki -> Gemini).
const TEXT_STAGES = [
  'Reading the article',
  'Applying persona and brand',
  'Odin → Loki: writing the post',
  'Ready for your review',
];
// Carousels/posters stop at "ready for review": nothing is rendered or hardened
// until the reviewer explicitly approves.
const CAROUSEL_STAGES = [
  'Reading the article',
  'Applying persona and brand',
  'Odin → Loki: writing the slides',
  'Ready for your review',
];
const POSTER_STAGES = [
  'Reading the article',
  'Applying persona and brand',
  'Odin → Loki: writing the poster',
  'Ready for your review',
];

// X (Twitter) native shape options. X has no carousel/document format.
const X_FORMATS = [
  { id: 'Thread', label: 'Thread' },
  { id: 'Single Post', label: 'Single Post' },
];

// Social Library deep links carry the asset kind; map it to the format selector.
const KIND_TO_FORMAT = {
  carousel: 'PDF Carousel',
  poster: 'Single Image/Poster',
  text: 'Text-only',
};

// Which saved asset to restore for a channel (the deep-linked kind wins, then
// text -> carousel -> poster order), shaped for the editor state. Entries
// without a status predate the review flow and are treated as approved.
function restoredResultFor(item, activeChannel, kindParam) {
  const socials = item?.socials || {};
  const text = socials[activeChannel];
  const carousel = socials[`${activeChannel}_carousel`];
  const poster = socials[`${activeChannel}_poster`];
  // Text: flattened shape (post/thread on the doc) or the legacy nested `copy`.
  const hasText = !!(text && (text.post != null || Array.isArray(text.thread) || text.copy));
  const hasCarousel = !!carousel?.slides;
  const hasPoster = !!poster?.headline;

  let pick = null;
  if (kindParam === 'text' && hasText) pick = 'text';
  else if (kindParam === 'carousel' && hasCarousel) pick = 'carousel';
  else if (kindParam === 'poster' && hasPoster) pick = 'poster';
  else if (hasText) pick = 'text';
  else if (hasCarousel) pick = 'carousel';
  else if (hasPoster) pick = 'poster';

  if (pick === 'text') {
    const copy = text.copy || {};
    const post = text.post ?? copy.post ?? null;
    const thread = Array.isArray(text.thread) ? text.thread : (Array.isArray(copy.thread) ? copy.thread : null);
    return {
      result: { format: 'text', status: text.status || 'approved', channel: activeChannel, post, thread, cta: text.cta ?? copy.cta ?? null, image: text.image || null, review: text.review || null },
      activity: { stages: TEXT_STAGES, active: TEXT_STAGES.length, status: 'done' },
    };
  }
  if (pick === 'carousel') {
    return {
      result: { format: 'carousel', status: carousel.status || 'approved', slides: carousel.slides, cta: carousel.cta, fileId: carousel.fileId, review: carousel.review || null, design: carousel.design || null, pdfStoragePath: carousel.pdfStoragePath || null },
      activity: { stages: CAROUSEL_STAGES, active: CAROUSEL_STAGES.length, status: 'done' },
    };
  }
  if (pick === 'poster') {
    return {
      result: { format: 'poster', status: poster.status || 'approved', posterType: poster.posterType, stat: poster.stat, headline: poster.headline, subline: poster.subline, cta: poster.cta, fileId: poster.fileId, review: poster.review || null, design: poster.design || null, imageStoragePath: poster.imageStoragePath || null },
      activity: { stages: POSTER_STAGES, active: POSTER_STAGES.length, status: 'done' },
    };
  }
  return { result: null, activity: null };
}

export default function SocialMediaSyndication() {
  const { id: workspaceId, itemId, channel } = useParams();
  const navigate = useNavigate();
  const { canReview, isAdmin, user } = useAuth();
  // Reviewer rights are per-workspace now.
  const userCanReview = canReview(workspaceId);
  // Which asset the user came for (deep link from the Social Library): an
  // article can hold a text post AND a carousel/poster on the same channel.
  const [searchParams] = useSearchParams();
  const kindParam = (searchParams.get('kind') || '').toLowerCase();
  const [item, setItem] = useState(null);
  const [libraryItems, setLibraryItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(itemId || "");
  // The item this page works on: the route param, or the dropdown selection.
  const targetId = itemId || selectedItemId;
  // Loading is derived: we're loading whenever the fetched item isn't the
  // targeted one (covers deep links, first load, and dropdown switches).
  const [loadedItemId, setLoadedItemId] = useState(null);
  const loading = !!targetId && loadedItemId !== targetId;
  const [generating, setGenerating] = useState(false);

  // Source mode for global (no-article) mode: syndicate an existing article,
  // or compose original content from the creator's own idea (which creates a
  // social-only library item behind the scenes).
  const [sourceMode, setSourceMode] = useState('article');
  const [ideaText, setIdeaText] = useState('');

  // Configuration State
  const activeChannel = channel || 'linkedin';
  // The user's explicit persona choice; the EFFECTIVE persona (below) falls
  // back to the first profile available on the active channel.
  const [personaChoice, setPersonaChoice] = useState('Personal Profile');
  const [contentType, setContentType] = useState(KIND_TO_FORMAT[kindParam] || 'Text-only');
  const [xFormat, setXFormat] = useState('Thread');
  const [functionType, setFunctionType] = useState('teach');
  // Carousel brand templates (design). Fetched from the backend registry.
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('devfest');

  const [personas, setPersonas] = useState([]);
  const availablePersonas = personas.filter(p => (p.channels || []).includes(activeChannel));
  const persona = availablePersonas.some(p => p.id === personaChoice)
    ? personaChoice
    : (availablePersonas[0]?.id || '');

  // If the deep-linked kind changes while mounted, follow it (render-phase
  // adjustment; the initial value is seeded in useState above).
  const [lastKindParam, setLastKindParam] = useState(kindParam);
  if (lastKindParam !== kindParam) {
    setLastKindParam(kindParam);
    if (KIND_TO_FORMAT[kindParam]) setContentType(KIND_TO_FORMAT[kindParam]);
  }

  // Generation output + status
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  // Live activity panel: { stages: string[], active: number, status: 'running'|'done'|'error' }
  const [activity, setActivity] = useState(null);
  // Object URL for the generated poster PNG preview.
  const [posterUrl, setPosterUrl] = useState(null);
  // Object URL for the generated carousel PDF preview (Chrome's built-in viewer).
  const [carouselUrl, setCarouselUrl] = useState(null);

  // Custom Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Load workspace personas
  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => res.json())
      .then(data => {
        const ws = data.find(w => w.id === workspaceId);
        if (ws && ws.socialPersonas) setPersonas(ws.socialPersonas);
        if (ws && ws.carouselTemplate) setTemplateId(ws.carouselTemplate);
      })
      .catch(err => console.error("Failed to load workspace:", err));
  }, [workspaceId]);

  // Load the available carousel brand templates (design registry).
  useEffect(() => {
    authFetch(`${API_BASE}/api/carousel/templates`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.templates)) setTemplates(data.templates);
      })
      .catch(err => console.error("Failed to load templates:", err));
  }, []);

  // Load library items (for the source dropdown in global mode)
  useEffect(() => {
    authFetch(`${API_BASE}/api/library/${workspaceId}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setLibraryItems(data);
        }
      })
      .catch(err => console.error("Failed to load library:", err));
  }, [workspaceId]);

  // Load the targeted item (deep link or dropdown selection).
  useEffect(() => {
    if (!targetId) return;
    let stale = false;
    authFetch(`${API_BASE}/api/library/item/${targetId}`)
      .then(res => res.json())
      .then(data => { if (!stale) setItem(data); })
      .catch(err => console.error('[SocialSyndication] item fetch failed:', err))
      .finally(() => { if (!stale) setLoadedItemId(targetId); });
    return () => { stale = true; };
  }, [targetId]);

  // ---- Review lifecycle (carousels & posters) --------------------------------
  // Generated carousels/posters arrive as status 'draft'. The reviewer edits the
  // words inline, can ask Loki to redo one slide or the whole piece, previews on
  // demand, and only an explicit approval renders + hardens the artifact.
  const saveTimer = useRef(null);
  const [revising, setRevising] = useState(false); // false | 'all' | slide index
  const [approving, setApproving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  // Undo history for Loki's studio canvas updates (content snapshots, newest last).
  const [undoStack, setUndoStack] = useState([]);
  // Live mirror of `result` so studio SSE callbacks always read the current canvas.
  const resultRef = useRef(null);
  useEffect(() => { resultRef.current = result; });
  // Full-screen studio takeover (chat left, canvas pages right). Opens when a
  // draft carousel/poster is generated, and on demand for a restored draft.
  const [studioOpen, setStudioOpen] = useState(false);
  const previewRef = useRef(null);
  // Manage mode: when an asset already exists, the config card collapses behind
  // this toggle so regeneration is a deliberate act, not the default invitation.
  const [configOpen, setConfigOpen] = useState(false);
  // Snapshot of the pre-revise state for an untouched revise session, keyed to
  // the restore identity below so a stale snapshot from another item/channel
  // can never apply.
  const reviseSnapshot = useRef(null);

  // Restore previously-generated content for this channel when the item opens
  // or the channel changes; clear if there is none. Keyed on the item's
  // IDENTITY (not the object) so local edits synced back into `item` don't
  // stomp in-flight edits. Runs as a render-phase reset (React's "derived
  // state" pattern); object-URL revocation happens in the watcher effects below.
  const restoreKey = `${item?.id ?? ''}|${itemId ?? ''}|${selectedItemId}|${activeChannel}|${kindParam ?? ''}`;
  const [lastRestoreKey, setLastRestoreKey] = useState(null);
  if (lastRestoreKey !== restoreKey) {
    setLastRestoreKey(restoreKey);
    setError(null);
    setUndoStack([]);
    setStudioOpen(false);
    setConfigOpen(false);
    setCarouselUrl(null);
    setPosterUrl(null);
    const restored = restoredResultFor(item, activeChannel, kindParam);
    setResult(restored.result);
    setActivity(restored.activity);
  }

  // Revoke object URLs once they're replaced or cleared (side effect — kept out
  // of the render-phase reset above; revoking an already-revoked URL is a no-op).
  const prevPosterUrl = useRef(null);
  useEffect(() => {
    if (prevPosterUrl.current && prevPosterUrl.current !== posterUrl) URL.revokeObjectURL(prevPosterUrl.current);
    prevPosterUrl.current = posterUrl;
  }, [posterUrl]);
  const prevCarouselUrl = useRef(null);
  useEffect(() => {
    if (prevCarouselUrl.current && prevCarouselUrl.current !== carouselUrl) URL.revokeObjectURL(prevCarouselUrl.current);
    prevCarouselUrl.current = carouselUrl;
  }, [carouselUrl]);

  const handleGenerateSocials = async () => {
    // No article selected + idea mode = compose original content from the idea.
    const isIdeaCompose = !targetId && sourceMode === 'idea';
    if (!targetId && !isIdeaCompose) {
      setError('Select a source article first.');
      return;
    }
    if (isIdeaCompose && !ideaText.trim()) {
      setError('Write your idea first.');
      return;
    }
    // Format is scoped per channel: X never uses the LinkedIn carousel/poster formats,
    // so switching channels can't leak a carousel format into X (no stray PDF).
    const effectiveFormat = activeChannel === 'x' ? xFormat : contentType;
    const isCarousel = /carousel/i.test(String(effectiveFormat || ''));
    const isPoster = !isCarousel && /poster|image/i.test(String(effectiveFormat || ''));
    const baseStages = isCarousel ? CAROUSEL_STAGES : isPoster ? POSTER_STAGES : TEXT_STAGES;
    const stages = isIdeaCompose ? ['Reading your idea', ...baseStages.slice(1)] : baseStages;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    setGenerating(true);
    setError(null);
    setResult(null);
    setActivity({ stages, active: 0, status: 'running' });

    // Advance the two fast prep stages, then hold on "Loki is writing" (the long one)
    // until the real response returns.
    const timers = [];
    timers.push(setTimeout(() => setActivity((a) => (a && a.status === 'running' ? { ...a, active: 1 } : a)), 500));
    timers.push(setTimeout(() => setActivity((a) => (a && a.status === 'running' ? { ...a, active: 2 } : a)), 1200));

    try {
      const levers = {
        channel: activeChannel,
        personaId: persona || null,
        function: functionType,
        format: effectiveFormat,
        template: templateId,
      };
      const res = await authFetch(`${API_BASE}${isIdeaCompose ? '/api/socials/compose' : '/api/generate-socials'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isIdeaCompose
          ? { workspaceId, idea: ideaText.trim(), ...levers }
          : { itemId: targetId, ...levers }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Generation failed');
      }
      timers.forEach(clearTimeout);
      // Compose created a fresh social-only item; jump to its studio page —
      // the restore effect there picks the draft up and offers Open Studio.
      if (isIdeaCompose && data.itemId) {
        setActivity((a) => (a ? { ...a, active: stages.length, status: 'done' } : a));
        setIdeaText('');
        navigate(`/workspace/${workspaceId}/library/item/${data.itemId}/social/${activeChannel}`);
        return;
      }
      setConfigOpen(false); // back to manage mode collapsed once the asset lands
      setActivity((a) => (a ? { ...a, active: stages.length - 1 } : a));
      await sleep(300);
      // Carousel/poster come back structured as reviewable DRAFTS; text comes
      // back under copy.
      if (data.format === 'carousel') {
        setResult({ format: 'carousel', status: data.status || 'approved', slides: data.slides || [], cta: data.cta, fileId: data.fileId, design: data.design || null, pdfStoragePath: null });
        syncItemSocial('carousel', { status: data.status || 'approved', slides: data.slides || [], cta: data.cta, fileId: data.fileId });
        if ((data.status || 'approved') === 'draft') setStudioOpen(true);
      } else if (data.format === 'poster') {
        setResult({ format: 'poster', status: data.status || 'approved', posterType: data.posterType, stat: data.stat, headline: data.headline, subline: data.subline, cta: data.cta, fileId: data.fileId });
        syncItemSocial('poster', { status: data.status || 'approved', posterType: data.posterType, stat: data.stat, headline: data.headline, subline: data.subline, cta: data.cta, fileId: data.fileId });
        if ((data.status || 'approved') === 'draft') setStudioOpen(true);
      } else {
        // Text now arrives as a reviewable draft too; open the studio to refine it.
        const st = data.status || 'approved';
        setResult({ format: 'text', status: st, channel: activeChannel, post: data.post ?? null, thread: data.thread ?? null, cta: data.cta ?? null, image: null });
        syncItemSocial('text', { status: st, post: data.post ?? null, thread: data.thread ?? null, cta: data.cta ?? null });
        if (st === 'draft') setStudioOpen(true);
      }
      setActivity((a) => (a ? { ...a, active: stages.length, status: 'done' } : a));
    } catch (err) {
      timers.forEach(clearTimeout);
      setActivity((a) => (a ? { ...a, status: 'error' } : a));
      console.error('[SocialSyndication] generate failed:', err);
      setError(err.message || 'Failed to generate social copy.');
    } finally {
      setGenerating(false);
    }
  };

  // Lock the page scroll behind the full-screen studio.
  useEffect(() => {
    document.body.style.overflow = studioOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [studioOpen]);

  const contentOf = (r) => (r.format === 'carousel'
    ? { slides: r.slides, cta: r.cta }
    : r.format === 'poster'
      ? { posterType: r.posterType, stat: r.stat, headline: r.headline, subline: r.subline, cta: r.cta }
      : { post: r.post ?? null, thread: r.thread ?? null, cta: r.cta });

  // Text lives at socials.<channel>; carousels/posters at socials.<channel>_<kind>.
  const socialKeyOf = (kind) => (kind === 'text' ? activeChannel : `${activeChannel}_${kind}`);

  // Mirror server-persisted social state back into the loaded item, so switching
  // channels or articles and returning restores the latest content rather than
  // what was fetched at page load.
  const syncItemSocial = (kind, patch) => {
    setItem(prev => {
      if (!prev) return prev;
      const key = socialKeyOf(kind);
      return { ...prev, socials: { ...(prev.socials || {}), [key]: { ...((prev.socials || {})[key] || {}), ...patch } } };
    });
  };

  const persistDraft = async (r) => {
    if (!targetId || !r) return;
    const content = contentOf(r);
    try {
      await authFetch(`${API_BASE}/api/socials/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, kind: r.format, content }),
      });
      // A real change persisted: any revise-session snapshot no longer applies.
      reviseSnapshot.current = null;
      syncItemSocial(r.format, { ...content, status: 'draft', fileId: null });
    } catch (err) {
      console.error('[SocialSyndication] draft save failed:', err);
    }
  };

  const queueDraftSave = (next) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDraft(next), 800);
  };
  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const updateSlide = (i, field, value) => {
    setResult(prev => {
      const slides = prev.slides.map((s, idx) => (idx === i ? { ...s, [field]: value } : s));
      const next = { ...prev, slides, fileId: null };
      queueDraftSave(next);
      return next;
    });
  };

  const updatePosterField = (field, value) => {
    setResult(prev => {
      const next = { ...prev, [field]: value, fileId: null };
      queueDraftSave(next);
      return next;
    });
  };

  const updateCarouselCta = (value) => {
    setResult(prev => {
      const next = { ...prev, cta: value, fileId: null };
      queueDraftSave(next);
      return next;
    });
  };

  // ---- Text canvas edits (LinkedIn post / X thread) --------------------------
  const updateTextPost = (value) => {
    setResult(prev => { const next = { ...prev, post: value }; queueDraftSave(next); return next; });
  };
  const updateThreadPost = (i, value) => {
    setResult(prev => {
      const thread = (prev.thread || []).map((t, idx) => (idx === i ? value : t));
      const next = { ...prev, thread }; queueDraftSave(next); return next;
    });
  };
  const addThreadPost = () => {
    setResult(prev => { const next = { ...prev, thread: [...(prev.thread || []), ''] }; queueDraftSave(next); return next; });
  };
  const removeThreadPost = (i) => {
    setResult(prev => { const next = { ...prev, thread: (prev.thread || []).filter((_, idx) => idx !== i) }; queueDraftSave(next); return next; });
  };
  const updateTextCta = (value) => {
    setResult(prev => { const next = { ...prev, cta: value }; queueDraftSave(next); return next; });
  };

  // ---- Per-post cover image (Hermes) -----------------------------------------
  const [isImageChatOpen, setIsImageChatOpen] = useState(false);

  // Save an approved Hermes image to this channel's post (temp URL -> stored).
  const handleApproveSocialImage = async (url) => {
    setIsImageChatOpen(false);
    if (!targetId) return;
    try {
      const res = await authFetch(`${API_BASE}/api/library/${targetId}/social/${activeChannel}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(url.startsWith('data:') ? { imageData: url } : { imageUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save image');
      setResult(prev => (prev ? { ...prev, image: data.image } : prev));
      syncItemSocial('text', { image: data.image });
    } catch (err) {
      console.error('[SocialSyndication] save social image failed:', err);
      setError('Could not save the cover image.');
    }
  };

  const handleDownloadSocialImage = async () => {
    const url = resultRef.current?.image?.url;
    if (!url) return;
    try {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (blob.type || '').includes('png') ? 'png' : 'jpg';
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `${activeChannel}-image.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err) {
      console.error('[SocialSyndication] social image download failed:', err);
      setError('Could not download the image.');
    }
  };

  // Ask Loki for another take: the whole piece, or one slide (slideIndex),
  // steered by the reviewer's note.
  const handleRevise = async (slideIndex = null) => {
    if (!targetId || !result) return;
    clearTimeout(saveTimer.current);
    setRevising(slideIndex === null ? 'all' : slideIndex);
    setError(null);
    try {
      const kind = result.format;
      const res = await authFetch(`${API_BASE}/api/socials/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: targetId,
          channel: activeChannel,
          kind,
          content: contentOf(result),
          note: null,
          slideIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Revision failed');
      const patch = kind === 'carousel'
        ? { slides: data.slides || [], cta: data.cta ?? null }
        : kind === 'poster'
          ? { posterType: data.posterType || 'statement', stat: data.stat ?? null, headline: data.headline ?? null, subline: data.subline ?? null, cta: data.cta ?? null }
          : { post: data.post ?? null, thread: data.thread ?? null, cta: data.cta ?? null };
      reviseSnapshot.current = null; // a Loki redo persisted server-side
      setResult(prev => ({ ...prev, ...patch, status: 'draft', fileId: null }));
      syncItemSocial(kind, { ...patch, status: 'draft', fileId: null });
    } catch (err) {
      console.error('[SocialSyndication] revise failed:', err);
      setError(err.message || 'Failed to revise the draft.');
    } finally {
      setRevising(false);
    }
  };

  // On-demand preview while in review: save the current edits, then render.
  const handlePreview = async () => {
    if (!targetId || !result) return;
    clearTimeout(saveTimer.current);
    setPreviewLoading(true);
    setError(null);
    try {
      const kind = result.format;
      await persistDraft(result);
      const res = await authFetch(`${API_BASE}/api/socials/${kind}/item/${targetId}/${activeChannel}`);
      if (!res.ok) throw new Error('Preview render failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (kind === 'carousel') {
        setCarouselUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      } else {
        setPosterUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      }
      // The preview page sits at the bottom of the canvas scroll; bring it into view.
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    } catch (err) {
      console.error('[SocialSyndication] preview failed:', err);
      setError('Could not render the preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // The creator's hardening step: render + persist as 'finalized'. Reviewer
  // approval (where used) happens afterwards via submit-for-review.
  const handleFinalize = async () => {
    if (!targetId || !result) return;
    clearTimeout(saveTimer.current);
    setApproving(true);
    setError(null);
    try {
      const kind = result.format;
      const content = contentOf(result);
      const res = await authFetch(`${API_BASE}/api/socials/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, kind, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Finalize failed');
      reviseSnapshot.current = null;
      setResult(prev => ({ ...prev, status: 'finalized', fileId: data.fileId || null }));
      syncItemSocial(kind, { ...content, status: 'finalized', fileId: data.fileId || null });
      setStudioOpen(false); // session over: back to the page with the rendered result
    } catch (err) {
      console.error('[SocialSyndication] finalize failed:', err);
      setError(err.message || 'Failed to finalize the draft.');
    } finally {
      setApproving(false);
    }
  };

  // ---- Review workflow (submit to tagged reviewers; reviewer decides) --------
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [socialChangesOpen, setSocialChangesOpen] = useState(false);
  const [socialChangesText, setSocialChangesText] = useState('');
  const [deciding, setDeciding] = useState(false); // false | 'approve' | 'request_changes'

  // Withdraw an active review request on the current piece: back to finalized.
  const handleSocialWithdraw = async () => {
    if (!targetId || !result) return;
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/reviews/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, kind: result.format, channel: activeChannel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');
      setResult(prev => ({ ...prev, status: 'finalized' }));
      syncItemSocial(result.format, { status: 'finalized' });
    } catch (err) {
      console.error('[SocialSyndication] withdraw failed:', err);
      setError(err.message || 'Failed to withdraw the review.');
    }
  };

  const handleSocialDecide = async (decision) => {
    if (!targetId || !result || deciding) return;
    if (decision === 'request_changes' && !socialChangesText.trim()) {
      setError('Add a note explaining the requested changes.');
      return;
    }
    setDeciding(decision);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE}/api/reviews/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: targetId,
          kind: result.format,
          channel: activeChannel,
          decision,
          comment: socialChangesText.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record the decision');
      setResult(prev => ({ ...prev, status: data.reviewStatus }));
      syncItemSocial(result.format, { status: data.reviewStatus });
      // Approved studio-designed posters freeze their bytes server-side so the
      // durable download matches what the reviewer approved.
      if (decision === 'approve' && result.format === 'poster' && result.design && !result.imageStoragePath) {
        await uploadPosterRender();
        await uploadCarouselRender();
      }
      setSocialChangesOpen(false);
      setSocialChangesText('');
    } catch (err) {
      console.error('[SocialSyndication] decide failed:', err);
      setError(err.message || 'Failed to record the decision.');
    } finally {
      setDeciding(false);
    }
  };

  // Reopen a finalized/approved piece for another editing round. Entering the
  // session does NOT demote the asset: the prior state is snapshotted (keyed
  // to the current item/channel identity) and nothing is persisted until an
  // actual change happens (edit, Loki update, redo). Closing the studio
  // untouched restores the asset exactly as it was.
  const handleReopen = () => {
    if (!result) return;
    reviseSnapshot.current = { key: restoreKey, status: result.status || 'approved', fileId: result.fileId ?? null };
    setResult(prev => ({ ...prev, status: 'draft' }));
    setStudioOpen(true);
  };

  const handleStudioClose = () => {
    const snap = reviseSnapshot.current;
    reviseSnapshot.current = null;
    // Untouched revise session: nothing was persisted; restore the prior
    // state. Snapshots from another item/channel are stale and ignored.
    if (snap && snap.key === restoreKey) {
      setResult(prev => (prev ? { ...prev, status: snap.status, fileId: snap.fileId } : prev));
    }
    setStudioOpen(false);
  };

  // Content payload for the studio chat: what Loki sees as CURRENT CONTENT
  // (snake_case keys on the wire, matching the agent's schema).
  const studioContent = () => {
    const r = resultRef.current;
    if (!r) return {};
    if (r.format === 'carousel') return { slides: r.slides, cta: r.cta };
    if (r.format === 'poster') return { poster_type: r.posterType, stat: r.stat, headline: r.headline, subline: r.subline, cta: r.cta };
    return { post: r.post ?? null, thread: r.thread ?? null, cta: r.cta };
  };

  // Apply a canvas update pushed by Loki from the studio chat: snapshot the
  // previous content for undo, apply immediately, persist as draft.
  const applyStudioUpdate = (update) => {
    const current = resultRef.current;
    if (!current) return;
    setUndoStack((s) => [...s.slice(-9), contentOf(current)]);
    setResult((prev) => {
      const patch = prev.format === 'carousel'
        ? { slides: update.slides || prev.slides, cta: update.cta ?? prev.cta }
        : prev.format === 'poster'
          ? { posterType: update.poster_type || prev.posterType, stat: update.stat ?? prev.stat, headline: update.headline ?? prev.headline, subline: update.subline ?? prev.subline, cta: update.cta ?? prev.cta }
          : { post: update.post ?? prev.post, thread: update.thread ?? prev.thread, cta: update.cta ?? prev.cta };
      const next = { ...prev, ...patch, fileId: null };
      queueDraftSave(next);
      return next;
    });
  };

  // Roll the canvas back to the snapshot before Loki's last update.
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const snapshot = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setResult((prev) => {
      const next = { ...prev, ...snapshot, fileId: null };
      queueDraftSave(next);
      return next;
    });
  };

  const handleDownloadCarousel = async () => {
    if (!targetId) return;
    try {
      // Live studio decks bind their PDF right here in the browser.
      if (resultRef.current?.design && !resultRef.current?.pdfStoragePath) {
        const pdf = await buildCarouselPdf();
        pdf.save(`carousel_${activeChannel}.pdf`);
        return;
      }
      // Durable download: frozen studio bytes from Storage, or the legacy
      // renderer for Classic decks.
      const res = await authFetch(`${API_BASE}/api/socials/carousel/item/${targetId}/${activeChannel}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carousel_${activeChannel}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SocialSyndication] carousel download failed:', err);
      setError('Could not download the carousel PDF.');
    }
  };

  // Studio-designed posters render live in the browser (SocialPosterCanvas);
  // the legacy Odin-rendered path fetches a PNG. A poster is "live" when a
  // studio design is chosen and no approved bytes are stored yet.
  const posterIsLive = result?.format === 'poster' && !!result?.design && !result?.imageStoragePath;
  const posterCanvasRef = useRef(null);

  // Persist the design pick so every viewer sees the same render.
  const handlePickPosterDesign = async (designId) => {
    const design = designId === 'classic' ? null : designId;
    setResult(prev => (prev ? { ...prev, design } : prev));
    syncItemSocial('poster', { design });
    try {
      await authFetch(`${API_BASE}/api/socials/poster-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, design: design || '' }),
      });
    } catch (err) {
      console.error('[SocialSyndication] design save failed:', err);
    }
  };

  // Render the live canvas to full-res PNG bytes and store them server-side —
  // called at approval so the durable download never needs a renderer again.
  const uploadPosterRender = async () => {
    if (!posterCanvasRef.current || !resultRef.current?.design) return;
    try {
      const dataUrl = await toPng(posterCanvasRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'scale(1)' } });
      const res = await authFetch(`${API_BASE}/api/socials/poster-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, imageData: dataUrl, design: resultRef.current.design }),
      });
      const data = await res.json();
      if (res.ok && data.imageStoragePath) {
        setResult(prev => (prev ? { ...prev, imageStoragePath: data.imageStoragePath } : prev));
        syncItemSocial('poster', { imageStoragePath: data.imageStoragePath });
      }
    } catch (err) {
      console.error('[SocialSyndication] poster render upload failed:', err);
    }
  };

  // Studio-designed carousels render live in the browser (SocialCarouselCanvas,
  // one page per slide + a CTA page); the legacy Odin path renders a PDF
  // server-side. Live = a studio design set is chosen and no approved PDF bytes
  // are stored yet.
  const carouselIsLive = result?.format === 'carousel' && !!result?.design && !result?.pdfStoragePath;
  const carouselPageRefs = useRef([]);

  // The deck's pages: Loki's slides plus, when a caption CTA exists, a closing
  // CTA page so the deck lands on the ask.
  const carouselPagesOf = (r) => {
    const pages = Array.isArray(r?.slides) ? [...r.slides] : [];
    if (r?.cta) pages.push({ kind: 'cta', heading: r.cta, body: '' });
    return pages;
  };

  // Persist the design-set pick so every viewer sees the same render.
  const handlePickCarouselDesign = async (designId) => {
    const design = designId === 'classic' ? null : designId;
    setResult(prev => (prev ? { ...prev, design } : prev));
    syncItemSocial('carousel', { design });
    try {
      await authFetch(`${API_BASE}/api/socials/carousel-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, design: design || '' }),
      });
    } catch (err) {
      console.error('[SocialSyndication] carousel design save failed:', err);
    }
  };

  // Bind the live pages into a PDF (JPEG pages keep it well under the upload
  // cap). Shared by the local download and the approval-time freeze.
  const buildCarouselPdf = async () => {
    // Bound by the CURRENT deck's page count — the refs array may carry stale
    // trailing entries from a previously rendered, longer deck.
    const pageCount = carouselPagesOf(resultRef.current).length;
    const nodes = carouselPageRefs.current.slice(0, pageCount).filter(Boolean);
    if (!nodes.length) throw new Error('No rendered pages to bind');
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'px', format: [SLIDE_W, SLIDE_H], orientation: 'portrait', hotfixes: ['px_scaling'] });
    for (let i = 0; i < nodes.length; i++) {
      const dataUrl = await toJpeg(nodes[i], { cacheBust: true, quality: 0.92, pixelRatio: 1.5, style: { transform: 'scale(1)' } });
      if (i > 0) pdf.addPage([SLIDE_W, SLIDE_H], 'portrait');
      pdf.addImage(dataUrl, 'JPEG', 0, 0, SLIDE_W, SLIDE_H);
    }
    return pdf;
  };

  // Render the live deck to PDF bytes and store them server-side — called at
  // approval so the durable download never needs a renderer again.
  const uploadCarouselRender = async () => {
    if (resultRef.current?.format !== 'carousel' || !resultRef.current?.design || !carouselPageRefs.current.filter(Boolean).length) return;
    try {
      const pdf = await buildCarouselPdf();
      const pdfData = pdf.output('datauristring').replace(/^data:application\/pdf;[^,]*base64,/, 'data:application/pdf;base64,');
      const res = await authFetch(`${API_BASE}/api/socials/carousel-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: targetId, channel: activeChannel, pdfData, design: resultRef.current.design }),
      });
      const data = await res.json();
      if (res.ok && data.pdfStoragePath) {
        setResult(prev => (prev ? { ...prev, pdfStoragePath: data.pdfStoragePath } : prev));
        syncItemSocial('carousel', { pdfStoragePath: data.pdfStoragePath });
      }
    } catch (err) {
      console.error('[SocialSyndication] carousel render upload failed:', err);
    }
  };

  // Fetch the poster PNG (auth-protected) as a blob for inline preview. Only
  // APPROVED posters render automatically; drafts preview on demand (the deps are
  // identity fields, not `result`, so typing an edit never triggers a render).
  // Live studio posters skip the fetch entirely — they render in the browser.
  useEffect(() => {
    if (result?.format !== 'poster' || (result?.status || 'approved') === 'draft') return;
    if (result?.design && !result?.imageStoragePath) return;
    let objectUrl = null;
    let cancelled = false;
    if (targetId) {
      authFetch(`${API_BASE}/api/socials/poster/item/${targetId}/${activeChannel}`)
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('preview failed'))))
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPosterUrl(prev => { if (prev) URL.revokeObjectURL(prev); return objectUrl; });
        })
        .catch(() => { if (!cancelled) setPosterUrl(null); });
    }
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [result?.format, result?.status, result?.fileId, result?.design, result?.imageStoragePath, targetId, activeChannel]);

  // Fetch the carousel PDF (auth-protected) as a blob for inline review in
  // Chrome's built-in PDF viewer — no download needed. Approved carousels only;
  // drafts preview on demand.
  useEffect(() => {
    if (result?.format !== 'carousel' || (result?.status || 'approved') === 'draft') return;
    // Live studio decks render in the browser until their PDF is frozen —
    // fetching here would fall back to the legacy renderer's look.
    if (result?.design && !result?.pdfStoragePath) return;
    let objectUrl = null;
    let cancelled = false;
    if (targetId) {
      authFetch(`${API_BASE}/api/socials/carousel/item/${targetId}/${activeChannel}`)
        .then((res) => (res.ok ? res.blob() : Promise.reject(new Error('preview failed'))))
        .then((blob) => {
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setCarouselUrl(prev => { if (prev) URL.revokeObjectURL(prev); return objectUrl; });
        })
        .catch(() => { if (!cancelled) setCarouselUrl(null); });
    }
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [result?.format, result?.status, result?.fileId, result?.design, result?.pdfStoragePath, targetId, activeChannel]);

  const handleDownloadPoster = async () => {
    if (!targetId) return;
    // Live studio posters export straight from the browser canvas.
    if (posterIsLive && posterCanvasRef.current) {
      try {
        const dataUrl = await toPng(posterCanvasRef.current, { cacheBust: true, pixelRatio: 2, style: { transform: 'scale(1)' } });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `poster_${activeChannel}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } catch (err) {
        console.error('[SocialSyndication] live poster export failed:', err);
        setError('Could not export the poster.');
      }
      return;
    }
    try {
      const res = await authFetch(`${API_BASE}/api/socials/poster/item/${targetId}/${activeChannel}`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poster_${activeChannel}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[SocialSyndication] poster download failed:', err);
      setError('Could not download the poster.');
    }
  };

  const handleCopy = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  // --- Channel Specific Renderers ---

  const CHANNEL_CFG = {
    linkedin: {
      label: 'LinkedIn',
      Icon: FaLinkedin,
      accent: 'text-[#0a66c2]',
      btn: 'bg-[#0a66c2] hover:bg-[#004182]',
      noun: 'Post',
      showFormat: true,
    },
    x: {
      label: 'X',
      Icon: FaXTwitter,
      accent: 'text-black',
      btn: 'bg-black hover:bg-slate-800',
      noun: 'Thread',
      showFormat: false,
    },
  };

  // Canvas pages: one large editable page per slide, scrolled vertically.
  const renderCarouselPages = () => (
    <>
      {result.slides.map((s, i) => {
        const feature = s.kind === 'hook' || s.kind === 'cta';
        const bodyLen = (s.body || '').length;
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Slide {i + 1} of {result.slides.length} — {s.kind}
              </span>
              <button
                onClick={() => handleRevise(i)}
                disabled={revising !== false || approving || previewLoading}
                title="Quick re-roll: Loki takes another pass at just this slide"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
              >
                {revising === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Redo
              </button>
            </div>
            <div className={`aspect-square w-full rounded-xl border p-8 md:p-10 flex flex-col shadow-sm ${feature ? 'bg-blue-600 border-blue-700' : 'bg-white border-slate-200'}`}>
              <input
                value={s.heading || ''}
                onChange={(e) => updateSlide(i, 'heading', e.target.value)}
                placeholder="Heading"
                className={`w-full bg-transparent text-xl md:text-2xl font-bold leading-tight mb-4 outline-none rounded focus:ring-1 ${feature ? 'text-white placeholder-white/40 focus:ring-white/50' : 'text-blue-900 focus:ring-blue-300'}`}
              />
              <textarea
                value={s.body || ''}
                onChange={(e) => updateSlide(i, 'body', e.target.value)}
                placeholder="Body"
                className={`w-full flex-1 bg-transparent text-base leading-relaxed resize-none outline-none rounded focus:ring-1 ${feature ? 'text-white/90 placeholder-white/40 focus:ring-white/50' : 'text-slate-600 focus:ring-blue-300'}`}
              />
              <span className={`text-xs text-right ${bodyLen > 220 ? (feature ? 'text-amber-200 font-medium' : 'text-amber-600 font-medium') : (feature ? 'text-white/50' : 'text-slate-300')}`}>
                {bodyLen}
              </span>
            </div>
          </div>
        );
      })}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Caption CTA — goes in the post caption, not on a slide</p>
        <input
          value={result.cta || ''}
          onChange={(e) => updateCarouselCta(e.target.value)}
          className="w-full border border-slate-200 bg-white rounded-xl px-5 py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>
    </>
  );

  // Canvas page for a poster: one large editable page.
  const renderPosterPage = () => {
    const headlineWords = (result.headline || '').trim().split(/\s+/).filter(Boolean).length;
    return (
      <>
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Poster — {result.posterType === 'stat' ? 'hero stat' : 'statement'}
            </span>
            <button
              onClick={() => handleRevise(null)}
              disabled={revising !== false || approving || previewLoading}
              title="Loki takes another pass at the whole poster"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
            >
              {revising === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Redo
            </button>
          </div>
          <div className="aspect-square w-full rounded-xl border border-slate-200 bg-white p-8 md:p-10 flex flex-col justify-center gap-6 shadow-sm">
            {result.posterType === 'stat' && (
              <input
                value={result.stat || ''}
                onChange={(e) => updatePosterField('stat', e.target.value)}
                placeholder="78%"
                className="w-full bg-transparent text-5xl md:text-6xl font-black text-blue-700 outline-none rounded focus:ring-1 focus:ring-blue-300"
              />
            )}
            <div>
              <input
                value={result.headline || ''}
                onChange={(e) => updatePosterField('headline', e.target.value)}
                placeholder="The one big message"
                className="w-full bg-transparent text-2xl md:text-3xl font-bold leading-tight text-slate-900 outline-none rounded focus:ring-1 focus:ring-blue-300"
              />
              <p className={`mt-2 text-xs ${headlineWords > 9 ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                {headlineWords} {headlineWords === 1 ? 'word' : 'words'} — aim under 9.
              </p>
            </div>
            <input
              value={result.subline || ''}
              onChange={(e) => updatePosterField('subline', e.target.value)}
              placeholder="Optional supporting line"
              className="w-full bg-transparent text-base text-slate-600 outline-none rounded focus:ring-1 focus:ring-blue-300"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Caption CTA — goes in the post caption, not on the art</p>
          <input
            value={result.cta || ''}
            onChange={(e) => updatePosterField('cta', e.target.value)}
            className="w-full border border-slate-200 bg-white rounded-xl px-5 py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </>
    );
  };

  // Cover image block, shared by the text canvas and the approved view. The image
  // is generated with Hermes (via the existing Odin cover-image chat) and is for
  // the user to download and attach when they post manually.
  const renderCoverImageSection = () => {
    const img = result.image?.url;
    return (
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cover image (optional)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsImageChatOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Image className="w-3.5 h-3.5" /> {img ? 'Change image' : 'Create with Hermes'}
            </button>
            {img && (
              <button
                onClick={handleDownloadSocialImage}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            )}
          </div>
        </div>
        {img ? (
          <img src={`${API_BASE}${img}`} alt="Post cover" className="w-full rounded-xl border border-slate-200 shadow-sm" />
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-400">
            No image yet. Generate one with Hermes to attach when you post.
          </div>
        )}
      </div>
    );
  };

  // Canvas for a text post: LinkedIn is one big editable body; X is an editable,
  // add/remove-able list of thread posts. Each gets a Loki re-roll (↻).
  const renderTextPage = () => {
    const busy = revising !== false || approving || generating;
    const isThread = activeChannel === 'x';
    if (isThread) {
      const thread = result.thread || [];
      return (
        <>
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Thread — {thread.length} {thread.length === 1 ? 'post' : 'posts'}
            </span>
            <button
              onClick={() => handleRevise(null)}
              disabled={busy}
              title="Loki takes another pass at the whole thread"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
            >
              {revising === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Redo all
            </button>
          </div>
          {thread.map((t, i) => {
            const over = (t || '').length > 280;
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">{i + 1}/{thread.length}</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRevise(i)}
                      disabled={busy}
                      title="Quick re-roll: Loki takes another pass at just this post"
                      className="text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
                    >
                      {revising === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                    {thread.length > 1 && (
                      <button onClick={() => removeThreadPost(i)} title="Remove this post" className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  value={t}
                  onChange={(e) => updateThreadPost(i, e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-base leading-relaxed resize-none outline-none rounded focus:ring-1 focus:ring-blue-300 text-slate-800"
                />
                <span className={`block text-xs text-right ${over ? 'text-amber-600 font-medium' : 'text-slate-300'}`}>{(t || '').length}/280</span>
              </div>
            );
          })}
          <button
            onClick={addThreadPost}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-3 text-sm font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add post
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Call-to-action</p>
            <input
              value={result.cta || ''}
              onChange={(e) => updateTextCta(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-xl px-5 py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          {renderCoverImageSection()}
        </>
      );
    }
    return (
      <>
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">LinkedIn post</span>
            <button
              onClick={() => handleRevise(null)}
              disabled={busy}
              title="Loki takes another pass at the whole post"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
            >
              {revising === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Redo
            </button>
          </div>
          <textarea
            value={result.post || ''}
            onChange={(e) => updateTextPost(e.target.value)}
            rows={16}
            placeholder="Post body"
            className="w-full rounded-xl border border-slate-200 bg-white p-6 text-base leading-relaxed resize-none shadow-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800"
          />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Call-to-action</p>
          <input
            value={result.cta || ''}
            onChange={(e) => updateTextCta(e.target.value)}
            className="w-full border border-slate-200 bg-white rounded-xl px-5 py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        {renderCoverImageSection()}
      </>
    );
  };

  // Full-screen studio takeover, ChatGPT/Claude canvas style: chat with Loki on
  // the left, the content on the right as large vertically-scrolling pages.
  // Approve/Preview/Undo live in the top bar; closing keeps the draft saved.
  const renderStudio = () => {
    if (!studioOpen || !result) return null;
    if ((result.status || 'approved') !== 'draft') return null;
    if (!['carousel', 'poster', 'text'].includes(result.format)) return null;
    const kind = result.format;
    const busy = revising !== false || approving || previewLoading || generating;
    const studioItemId = itemId || selectedItemId;
    const channelLabel = CHANNEL_CFG[activeChannel]?.label || activeChannel;
    const kindLabel = kind === 'carousel' ? 'Carousel' : kind === 'poster' ? 'Poster' : (activeChannel === 'x' ? 'Thread' : 'Post');
    const previewUrl = kind === 'carousel' ? carouselUrl : kind === 'poster' ? posterUrl : null;
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col bg-slate-100 animate-in fade-in duration-200">
        {/* Top bar: identity + session actions */}
        <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Bot size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                Odin Studio — {channelLabel} {kindLabel}
              </h2>
              <p className="text-xs text-slate-500 truncate">{getArticleTitle(item)}</p>
            </div>
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wider text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-1 shrink-0">Editing</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {undoStack.length > 0 && (
              <Button variant="outline" onClick={handleUndo} title="Undo Loki's last canvas update">
                <RotateCcw className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Undo</span>
              </Button>
            )}
            {kind !== 'text' && (
              <Button variant="outline" disabled={busy} onClick={handlePreview}>
                {previewLoading ? <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" /> : <Eye className="w-4 h-4 sm:mr-2" />}
                <span className="hidden sm:inline">Preview</span>
              </Button>
            )}
            <Button disabled={busy} onClick={handleFinalize} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {approving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {kind === 'text' ? 'Finalize' : (<><span className="hidden md:inline">Finalize & Render</span><span className="md:hidden">Finalize</span></>)}
            </Button>
            <button
              onClick={handleStudioClose}
              title="Close the studio (edits are saved; an untouched revise session keeps its previous status)"
              className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body: chat left (proportional, capped), canvas pages right */}
        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <div className="h-[45vh] md:h-auto md:w-[45%] md:min-w-[380px] md:max-w-[640px] shrink-0 border-b md:border-b-0 md:border-r border-slate-200 min-h-0">
            <StudioChat
              key={`${studioItemId}-${activeChannel}-${kind}`}
              itemId={studioItemId}
              channel={activeChannel}
              kind={kind}
              getContent={studioContent}
              onContentUpdate={applyStudioUpdate}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-6 md:px-8 py-10 space-y-10 pb-24">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              {kind === 'carousel' ? renderCarouselPages() : kind === 'poster' ? renderPosterPage() : renderTextPage()}
              {/* Rendered preview as the last page of the scroll. */}
              {previewUrl && (
                <div ref={previewRef}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Rendered preview — reflects the last render; re-preview after edits
                  </p>
                  {kind === 'carousel' ? (
                    <iframe
                      src={previewUrl}
                      title="Carousel PDF preview"
                      className="w-full rounded-xl border border-slate-200 bg-white shadow-sm"
                      style={{ height: '75vh' }}
                    />
                  ) : (
                    <img src={previewUrl} alt="Poster preview" className="w-full rounded-xl border border-slate-200 shadow-sm" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Status chip for finalized/in_review/approved social pieces (legacy entries
  // without a status predate the review flow and read as approved).
  const socialStatusChip = () => {
    const st = result?.status || 'approved';
    const map = {
      finalized: ['Finalized', 'text-blue-700 bg-blue-50 border-blue-200'],
      in_review: ['In review', 'text-amber-700 bg-amber-50 border-amber-200'],
      approved: ['Approved', 'text-emerald-700 bg-emerald-50 border-emerald-200'],
    };
    const [label, cls] = map[st] || map.finalized;
    return (
      <span className={`text-[11px] font-semibold uppercase tracking-wider border rounded-full px-2.5 py-1 shrink-0 ${cls}`}>{label}</span>
    );
  };

  // Lifecycle actions for a non-draft piece: Revise (except mid-review), Submit
  // for review (finalized), and the reviewer's Approve / Request changes.
  const renderSocialReviewActions = () => {
    const st = result?.status || 'approved';
    return (
      <>
        {st !== 'in_review' && (
          <Button variant="outline" onClick={handleReopen}>
            <Pencil className="w-4 h-4 mr-2" /> Revise
          </Button>
        )}
        {st === 'finalized' && (
          <Button onClick={() => setReviewModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
            <UserCheck className="w-4 h-4 mr-2" /> Submit for review
          </Button>
        )}
        {st === 'in_review' && userCanReview && (
          <>
            <Button onClick={() => handleSocialDecide('approve')} disabled={deciding !== false} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {deciding === 'approve' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Approve
            </Button>
            <Button variant="outline" disabled={deciding !== false} onClick={() => setSocialChangesOpen(v => !v)}>
              Request changes
            </Button>
          </>
        )}
        {st === 'in_review' && (isAdmin || result?.review?.requestedBy === user?.uid) && (
          <>
            <Button variant="outline" onClick={() => setReviewModalOpen(true)}>
              <UserCheck className="w-4 h-4 mr-2" /> Manage review
            </Button>
            <Button variant="ghost" onClick={handleSocialWithdraw} className="text-slate-500 hover:text-slate-800">
              Withdraw
            </Button>
          </>
        )}
      </>
    );
  };

  // Reviewer's request-changes note (required; also lands in the item's thread).
  const renderSocialChangesBox = () => {
    if (!socialChangesOpen || (result?.status || 'approved') !== 'in_review' || !userCanReview) return null;
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <textarea
          value={socialChangesText}
          onChange={(e) => setSocialChangesText(e.target.value)}
          rows={2}
          placeholder="What needs to change before this can be approved?"
          className="flex-1 resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
        />
        <div className="flex flex-col gap-1.5">
          <Button size="sm" onClick={() => handleSocialDecide('request_changes')} disabled={deciding !== false || !socialChangesText.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
            {deciding === 'request_changes' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send back'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSocialChangesOpen(false); setSocialChangesText(''); }}>
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    // Single poster image. Draft: editable words + review controls. Approved:
    // rendered preview + download.
    if (result.format === 'poster') {
      if ((result.status || 'approved') === 'draft') {
        return (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bot size={24} />
            </div>
            <p className="font-medium text-slate-700">Poster drafted — in review</p>
            <p className="max-w-md text-sm text-slate-500">Refine it with Loki in the studio, or edit the words yourself. Nothing is rendered until you finalize.</p>
            <Button onClick={() => setStudioOpen(true)} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Pencil className="w-4 h-4 mr-2" /> Open Studio
            </Button>
          </div>
        );
      }
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm text-slate-500 truncate">Single image poster</p>
              {socialStatusChip()}
            </div>
            <div className="flex items-center gap-2">
              {renderSocialReviewActions()}
              <Button onClick={() => handleDownloadPoster()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="w-4 h-4 mr-2" /> Download PNG
              </Button>
            </div>
          </div>
          {renderSocialChangesBox()}
          {/* Design picker: Classic = the legacy server render; the rest are
              Brand Studio designs rendered live. Locked once bytes are stored. */}
          {!result.imageStoragePath && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Design</span>
              <button onClick={() => handlePickPosterDesign('classic')}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-colors ${!result.design ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                Classic
              </button>
              {posterDesigns(result.posterType).map(dsg => (
                <button key={dsg.id} onClick={() => handlePickPosterDesign(dsg.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-colors ${result.design === dsg.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                  {dsg.label}
                </button>
              ))}
            </div>
          )}
          {posterIsLive ? (
            <div className="mx-auto rounded-lg border border-slate-200 shadow-sm overflow-hidden" style={{ width: 'min(100%, 448px)' }}>
              <SocialPosterCanvas
                poster={{ posterType: result.posterType, stat: result.stat, headline: result.headline, subline: result.subline }}
                design={result.design}
                scale={448 / POSTER_W}
                canvasRef={posterCanvasRef}
              />
            </div>
          ) : posterUrl ? (
            <img src={posterUrl} alt="Generated poster" className="w-full max-w-md mx-auto rounded-lg border border-slate-200 shadow-sm" />
          ) : (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" /> Loading preview...
            </div>
          )}
          {result.cta && (
            <p className="text-xs text-slate-500"><span className="font-semibold">Caption CTA:</span> {result.cta}</p>
          )}
        </div>
      );
    }
    // PDF carousel. Draft: editable slide cards + per-slide redo + review
    // controls. Approved: rendered PDF preview + download.
    if (result.format === 'carousel') {
      if ((result.status || 'approved') === 'draft') {
        return (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bot size={24} />
            </div>
            <p className="font-medium text-slate-700">{result.slides.length} slides drafted — in review</p>
            <p className="max-w-md text-sm text-slate-500">Refine them with Loki in the studio, or edit any slide yourself. Nothing is rendered until you finalize.</p>
            <Button onClick={() => setStudioOpen(true)} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Pencil className="w-4 h-4 mr-2" /> Open Studio
            </Button>
          </div>
        );
      }
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm text-slate-500 truncate">{result.slides.length} slides</p>
              {socialStatusChip()}
            </div>
            <div className="flex items-center gap-2">
              {renderSocialReviewActions()}
              {carouselUrl && (
                <Button variant="outline" onClick={() => window.open(carouselUrl, '_blank', 'noopener')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open in new tab
                </Button>
              )}
              <Button onClick={() => handleDownloadCarousel()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </div>
          {renderSocialChangesBox()}
          {/* Design picker: Classic = the legacy server render; the rest are
              Brand Studio design sets rendered live. Locked once bytes are stored. */}
          {!result.pdfStoragePath && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">Design</span>
              <button onClick={() => handlePickCarouselDesign('classic')}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-colors ${!result.design ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                Classic
              </button>
              {CAROUSEL_DESIGNS.map(dsg => (
                <button key={dsg.id} onClick={() => handlePickCarouselDesign(dsg.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold border transition-colors ${result.design === dsg.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                  {dsg.label}
                </button>
              ))}
            </div>
          )}
          {carouselIsLive ? (
            /* Live studio deck: every page rendered in the browser through the
               chosen design set; these nodes are also what gets bound into the
               PDF (locally for downloads, frozen server-side at approval). */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {carouselPagesOf(result).map((s, i, pages) => (
                <div key={i} className="rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <SocialCarouselCanvas
                    slide={s}
                    index={i}
                    count={pages.length}
                    design={result.design}
                    scale={300 / SLIDE_W}
                    canvasRef={(el) => { carouselPageRefs.current[i] = el; }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {result.slides.map((s, i) => {
                const feature = s.kind === 'hook' || s.kind === 'cta';
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg border p-4 flex flex-col justify-center overflow-hidden ${feature ? 'bg-blue-600 border-blue-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}
                  >
                    <span className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${feature ? 'text-white/70' : 'text-slate-400'}`}>{s.kind} · {i + 1}/{result.slides.length}</span>
                    <p className={`font-bold leading-tight mb-1 ${feature ? 'text-white' : 'text-blue-900'}`} style={{ fontSize: '13px' }}>{s.heading}</p>
                    <p className={`text-[11px] leading-snug line-clamp-4 ${feature ? 'text-white/90' : 'text-slate-600'}`}>{s.body}</p>
                  </div>
                );
              })}
            </div>
          )}
          {/* Rendered PDF, reviewable inline via Chrome's PDF viewer — live
              studio decks review above; their PDF appears once frozen. */}
          {!carouselIsLive && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">PDF preview</p>
              {carouselUrl ? (
                <iframe
                  src={carouselUrl}
                  title="Carousel PDF preview"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50"
                  style={{ height: '540px' }}
                />
              ) : (
                <div className="py-16 text-center text-slate-400 rounded-lg border border-slate-200 bg-slate-50">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" /> Rendering PDF preview...
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    // Text post (LinkedIn body / X thread). Draft: Open Studio card. Approved:
    // the post + optional cover image + copy controls.
    if (result.format === 'text') {
      const isThread = activeChannel === 'x';
      if ((result.status || 'approved') === 'draft') {
        const count = isThread ? (result.thread || []).length : 1;
        return (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Bot size={24} />
            </div>
            <p className="font-medium text-slate-700">
              {isThread ? `${count} thread ${count === 1 ? 'post' : 'posts'} drafted` : 'Post drafted'} — in review
            </p>
            <p className="max-w-md text-sm text-slate-500">Refine it with Loki in the studio, edit the words yourself, and add a cover image. Finalize when you're happy — then it can go for review.</p>
            <Button onClick={() => setStudioOpen(true)} className="mt-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Pencil className="w-4 h-4 mr-2" /> Open Studio
            </Button>
          </div>
        );
      }
      // Finalized / in review / approved.
      const thread = result.thread || [];
      return (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm text-slate-500 truncate">{isThread ? 'X thread' : 'LinkedIn post'}</p>
              {socialStatusChip()}
            </div>
            <div className="flex items-center gap-2">
              {renderSocialReviewActions()}
            </div>
          </div>
          {renderSocialChangesBox()}
          {renderCoverImageSection()}
          {isThread ? (
            <div className="space-y-4">
              {thread.map((t, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-xs font-semibold text-slate-400 pt-0.5">{i + 1}/{thread.length}</span>
                    <button onClick={() => handleCopy(t, `x-${i}`)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Copy this post">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed mt-1">{t}</p>
                </div>
              ))}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleCopy(thread.join('\n\n'), 'x-all')}>
                  <Copy className="w-4 h-4 mr-2" /> {copiedKey === 'x-all' ? 'Copied!' : 'Copy Thread'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5">
                <p className="whitespace-pre-wrap text-slate-800 text-sm leading-relaxed">{result.post || ''}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => handleCopy(result.post || '', 'li')}>
                  <Copy className="w-4 h-4 mr-2" /> {copiedKey === 'li' ? 'Copied!' : 'Copy Post'}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderActivity = () => {
    if (!activity) {
      return (
        <div className="text-center text-slate-400 py-12">
          <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">Nothing running yet</p>
          <p className="text-sm mt-1">Configure on the left, then click Draft. Live progress shows here.</p>
        </div>
      );
    }
    const { stages, active, status } = activity;
    return (
      <ol className="space-y-4">
        {stages.map((label, i) => {
          const done = status === 'done' || i < active;
          const isCurrent = i === active && status !== 'done';
          const isError = isCurrent && status === 'error';
          const isRunning = isCurrent && status === 'running';
          return (
            <li key={i} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center shrink-0">
                {done ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </span>
                ) : isError ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
                    <X className="h-4 w-4 text-red-600" />
                  </span>
                ) : isRunning ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span className={`text-sm ${done ? 'text-slate-600' : isError ? 'text-red-600 font-medium' : isRunning ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    );
  };

  const renderChannel = (channelKey) => {
    const cfg = CHANNEL_CFG[channelKey];
    const Icon = cfg.Icon;

    // The generation form (persona, goal, format, template, Draft button).
    const configCard = (
        <Card className="border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-blue-100 bg-blue-50/70 pb-4 shrink-0">
            <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-600 shadow-sm border border-blue-100">
                <Settings2 size={16} />
              </div>
              Post Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label>Social Profile</Label>
                <Select
                  value={persona}
                  onChange={(e) => setPersonaChoice(e.target.value)}
                  disabled={availablePersonas.length === 0}
                >
                  {availablePersonas.length === 0 ? (
                    <option value="">No Social Profiles Configured</option>
                  ) : (
                    availablePersonas.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </Select>
                <p className="text-xs text-slate-500">Who is speaking. Sets the voice ("I" vs "we").</p>
              </div>

              <div className="space-y-1.5">
                <Label>Post Goal</Label>
                <Select
                  value={functionType}
                  onChange={(e) => setFunctionType(e.target.value)}
                >
                  {SOCIAL_FUNCTIONS.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">
                  {SOCIAL_FUNCTIONS.find(f => f.id === functionType)?.hint}
                </p>
              </div>
            </div>

            {cfg.showFormat && (
              <div className="space-y-1.5 mt-6 max-w-md">
                <Label>Content Format</Label>
                <Select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <option value="Text-only">Text Only (Storytelling)</option>
                  <option value="PDF Carousel">PDF Carousel (Actionable Steps)</option>
                  <option value="Single Image/Poster">Single Image / Poster (Visual Hook)</option>
                </Select>
                <p className="text-xs text-slate-500">Adapts the structure and length.</p>
              </div>
            )}

            {channelKey === 'x' && (
              <div className="space-y-1.5 mt-6 max-w-md">
                <Label>Format</Label>
                <Select
                  value={xFormat}
                  onChange={(e) => setXFormat(e.target.value)}
                >
                  {X_FORMATS.map(f => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </Select>
                <p className="text-xs text-slate-500">A single post, or a connected thread.</p>
              </div>
            )}

            {cfg.showFormat && /carousel/i.test(contentType) && (
              <div className="space-y-2 mt-6 max-w-md">
                <label className="text-sm font-medium text-slate-700">Design Template</label>
                <div className="relative">
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full appearance-none border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    {templates.length === 0 ? (
                      <option value="devfest">DevFest Mauritius — Light</option>
                    ) : (
                      templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  {templates.find(t => t.id === templateId)?.description || 'The brand look of the PDF slides.'}
                </p>
              </div>
            )}

            <div className="mt-auto pt-8">
              <button
                onClick={handleGenerateSocials}
                disabled={generating}
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 ${activeChannel === 'x' ? 'bg-black hover:bg-neutral-800' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {generating ? (
                  <><Loader2 size={18} className="animate-spin" /> Generating Draft...</>
                ) : (
                  <><Share2 size={18} /> Draft {cfg.label} {cfg.noun}</>
                )}
              </button>
            </div>
          </CardContent>
        </Card>
    );

    // Live generation progress; only meaningful while a run is active, so it
    // appears only in create mode (starting a generation clears `result`).
    const activityCard = (
        <Card className="border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-blue-100 bg-blue-50/70 pb-4 shrink-0">
            <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-emerald-600 shadow-sm border border-blue-100">
                <Activity size={16} />
              </div>
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {renderActivity()}
          </CardContent>
        </Card>
    );

    // The asset itself (or the empty-state prompt).
    const outputCard = (
        <Card className="border shadow-sm">
          <CardHeader className="border-b border-blue-100 bg-blue-50/70 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
              <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm border border-blue-100 ${cfg.accent}`}>
                <Icon size={16} />
              </div>
              Generated {cfg.label} Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {result ? (
              renderResult()
            ) : (
              !error && (
                <div className="text-center text-slate-400 py-16 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                  <Share2 className="w-12 h-12 mx-auto text-slate-300 mb-4 opacity-50" />
                  <p className="text-slate-600 font-medium">No draft generated yet.</p>
                  <p className="text-sm mt-1">Configure your settings above and click Draft.</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
    );

    // Create mode: nothing exists yet for this channel, so configuring a
    // generation leads (today's familiar layout).
    if (!result) {
      return (
        <div className="space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {configCard}
            {activityCard}
          </div>
          {outputCard}
        </div>
      );
    }

    // Manage mode: an asset exists (including Social Library deep links) — it
    // leads full-width, and regeneration sits behind a deliberate toggle.
    // Starting a generation clears `result`, flipping back to create mode with
    // the live activity visible.
    return (
      <div className="space-y-6 w-full">
        {outputCard}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setConfigOpen(v => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <span className="flex items-center gap-2.5">
              <Settings2 size={16} className="text-slate-400" />
              Generate new {cfg.label} content for this {item?.sourceType === 'original' ? 'idea' : 'article'}
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${configOpen ? 'rotate-180' : ''}`} />
          </button>
          {configOpen && (
            <div className="space-y-3 border-t border-slate-100 bg-slate-50/50 p-6">
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Drafting the same format again replaces the existing one for this channel. A different format is saved alongside it.
              </p>
              {configCard}
            </div>
          )}
        </div>
      </div>
    );
  };


  const renderPlaceholder = (platform, Icon, color) => (
    <div className="w-full">
      <Card className="border shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <CardTitle className="flex items-center gap-2.5 text-slate-800 text-lg font-semibold tracking-tight">
            <div className={`flex h-8 w-8 items-center justify-center rounded-md bg-white shadow-sm border border-slate-200 ${color}`}>
              <Icon size={16} />
            </div>
            {platform} Syndication
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-slate-400 py-16 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <Icon className="w-12 h-12 mx-auto text-slate-300 mb-4 opacity-50" />
            <p className="text-slate-600 font-medium">Coming Soon</p>
            <p className="text-sm mt-1">Configuration and drafting for {platform} is under construction.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Channels that aren't wired up yet are hard-gated: no composer, no article
  // picker, no activity log — just the notice. Remove a channel here (and add
  // it to the render list below) when it ships.
  const comingSoon = {
    instagram: ['Instagram', FaInstagram, 'text-pink-600'],
    facebook: ['Facebook', FaFacebook, 'text-blue-600'],
    tiktok: ['TikTok', FaTiktok, 'text-black'],
  }[activeChannel];
  if (comingSoon) {
    const [platform, Icon, color] = comingSoon;
    return renderPlaceholder(platform, Icon, color);
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        
        {!itemId && (
          <div className="mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => setSourceMode('article')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                sourceMode === 'article'
                  ? 'border-blue-300 bg-blue-50/70 shadow-sm ring-1 ring-blue-200'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${sourceMode === 'article' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                <FileText size={17} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${sourceMode === 'article' ? 'text-blue-900' : 'text-slate-800'}`}>From an article</p>
                <p className="mt-0.5 text-xs text-slate-500">Syndicate a library article into social copy.</p>
              </div>
            </button>
            <button
              onClick={() => setSourceMode('idea')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                sourceMode === 'idea'
                  ? 'border-amber-300 bg-amber-50/70 shadow-sm ring-1 ring-amber-200'
                  : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/40'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${sourceMode === 'idea' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600'}`}>
                <Lightbulb size={17} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${sourceMode === 'idea' ? 'text-amber-900' : 'text-slate-800'}`}>From an original idea</p>
                <p className="mt-0.5 text-xs text-slate-500">Start from your own idea — no article needed.</p>
              </div>
            </button>
          </div>
        )}

        {!itemId && sourceMode === 'idea' && (
          <div className="mt-4 w-full">
            <label className="block text-sm font-semibold text-slate-800 mb-2">Your Idea</label>
            <textarea
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="What do you want to say? A hook, an observation, a lesson learned — rough notes are fine. Loki develops your idea without adding facts you didn't give it."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm shadow-sm outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="text-xs text-slate-500">
                Original content — no source article. The result lands in the Social Library with the same review flow as everything else.
              </p>
              <span className={`shrink-0 text-xs tabular-nums ${ideaText.length > 4500 ? 'font-medium text-amber-600' : 'text-slate-400'}`}>
                {ideaText.length.toLocaleString()}/5,000
              </span>
            </div>
          </div>
        )}

        {!itemId && sourceMode === 'article' && (
          <div className="mt-4 w-full">
            <label className="block text-sm font-semibold text-slate-800 mb-2">Select Source Article</label>
            <div className="relative" ref={dropdownRef}>
              <div 
                className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl pl-12 pr-10 py-3.5 shadow-sm hover:border-slate-300 transition-colors cursor-pointer text-sm font-medium flex items-center justify-between"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FileText className="h-5 w-5 text-slate-400" />
                </div>
                <span className="truncate">
                  {selectedItemId && libraryItems.find(i => i.id === selectedItemId) 
                    ? (() => {
                        const sel = libraryItems.find(i => i.id === selectedItemId);
                        return `${getArticleTitle(sel)} (${sel.status})`;
                      })()
                    : "Choose an article to syndicate..."}
                </span>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
                  <div className="p-1">
                    {libraryItems.map(libItem => (
                      <div
                        key={libItem.id}
                        className={`px-4 py-3 cursor-pointer text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${libItem.id === selectedItemId ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                        onClick={() => {
                          setSelectedItemId(libItem.id);
                          setDropdownOpen(false);
                          navigate(`/workspace/${workspaceId}/library/item/${libItem.id}/social/${activeChannel}`);
                        }}
                      >
                        <FileText className={`h-4 w-4 shrink-0 ${libItem.id === selectedItemId ? 'text-blue-500' : 'text-slate-400'}`} />
                        <span className="truncate">{getArticleTitle(libItem)}</span>
                        <span className="ml-auto text-xs text-slate-400 font-normal capitalize">({(libItem.status || 'draft').replace('_', ' ')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(item || itemId) && (
          <div className="mt-4 flex min-w-0 items-center gap-2 text-slate-500">
            {item?.sourceType === 'original' ? (
              <>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                  <Lightbulb size={12} /> Original idea
                </span>
                <span className="truncate font-semibold text-slate-600">{item ? getArticleTitle(item) : "Loading..."}</span>
              </>
            ) : (
              <p className="truncate">
                Source: <span className="font-semibold text-slate-600">{item ? getArticleTitle(item) : "Loading..."}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {(!item && !itemId && sourceMode !== 'idea') ? (() => {
        const socialHistory = libraryItems.filter(libItem => libItem.socials?.[activeChannel]);
        // Sort by generation time, most recent first
        socialHistory.sort((a, b) => {
          const aTime = a.socials[activeChannel].generatedAt?._seconds || 0;
          const bTime = b.socials[activeChannel].generatedAt?._seconds || 0;
          return bTime - aTime;
        });

        return (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-slate-400" /> Recent Activity Log ({activeChannel})
          </h3>
          {socialHistory.length === 0 ? (
            <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
              <Clock className="mx-auto mb-2 opacity-30" size={24} />
              No recent {activeChannel} posts generated yet.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {socialHistory.slice(0, 10).map(libItem => {
                  const socialData = libItem.socials[activeChannel];
                  const generatedAt = socialData.generatedAt?._seconds 
                    ? new Date(socialData.generatedAt._seconds * 1000) 
                    : (socialData.generatedAt ? new Date(socialData.generatedAt) : new Date());
                  
                  const statusStr = socialData.function || 'generated';
                  const displayTitle = getArticleTitle(libItem);
                  
                  // Blue color for generated social posts
                  let statusColor = "bg-indigo-500";

                  return (
                    <div key={libItem.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={() => navigate(`/workspace/${workspaceId}/library/item/${libItem.id}/social/${activeChannel}`)}>
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden relative flex items-center justify-center text-slate-400 group-hover:border-blue-300 transition-colors">
                          {libItem.coverImage?.url ? (
                            <img
                              src={`${API_BASE}${libItem.coverImage.url}`}
                              alt="Thumbnail"
                              loading="lazy"
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <FileText size={18} className="group-hover:text-blue-500 transition-colors relative z-10" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{displayTitle}</p>
                          <p className="truncate text-xs text-slate-500">{libItem.topic || "Social Draft"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 pl-4">
                        <div className="hidden sm:flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${statusColor}`}></span>
                          <span className="text-[13px] text-slate-500 capitalize">{statusStr}</span>
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap tabular-nums font-medium">
                          {generatedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );})() : (
        <>
          {activeChannel === 'linkedin' && renderChannel('linkedin')}
          {activeChannel === 'x' && renderChannel('x')}
          {!['linkedin', 'x'].includes(activeChannel) && (
            <div className="text-slate-500">Unknown channel.</div>
          )}
        </>
      )}

      {/* Full-screen studio takeover (chat left, canvas pages right). */}
      {renderStudio()}

      {/* Cover-image chat (Odin -> Hermes) for the current text post. */}
      {isImageChatOpen && (
        <ImageChatModal
          onClose={() => setIsImageChatOpen(false)}
          draftContent={
            result?.format === 'text'
              ? (activeChannel === 'x' ? (result.thread || []).join('\n\n') : (result.post || ''))
              : (item?.draft || item?.idea || '')
          }
          initialPrompt={null}
          onApproveImage={handleApproveSocialImage}
        />
      )}

      {/* Submit the current finalized piece for review by tagged reviewers, or
          manage the reviewer list of an active review. */}
      {reviewModalOpen && result && (
        <SubmitReviewModal
          workspaceId={workspaceId}
          itemId={itemId || selectedItemId}
          kind={result.format}
          channel={activeChannel}
          mode={result.status === 'in_review' ? 'update' : 'submit'}
          initialSelected={result.status === 'in_review' ? (result.review?.reviewers || []) : []}
          initialNote={result.status === 'in_review' ? (result.review?.note || '') : ''}
          onClose={() => setReviewModalOpen(false)}
          onSubmitted={({ reviewers, note }) => {
            setReviewModalOpen(false);
            const review = { ...(result.review || {}), reviewers, note, requestedBy: result.review?.requestedBy || user?.uid };
            setResult(prev => ({ ...prev, status: 'in_review', review }));
            syncItemSocial(result.format, { status: 'in_review', review });
          }}
        />
      )}
    </div>
  );
}