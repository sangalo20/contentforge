import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, ExternalLink, Save, ArrowLeft, FileText, Layers, Image as ImageIcon, X, Maximize2, Share2, Download, UserCheck, Check, Loader2, ShieldCheck, ChevronDown, Palette } from 'lucide-react';
import { sourcesOf, sourceSummary, metaOf } from '../lib/sourceMeta';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import ImageChatModal from './ImageChatModal';
import CommentThread from './CommentThread';
import SubmitReviewModal from './SubmitReviewModal';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';

export default function LibraryItemViewer() {
  const { id: workspaceId, itemId } = useParams();
  const id = itemId || workspaceId; // Fallback for safety
  const navigate = useNavigate();
  const { isAdmin, canReview, user } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('draft'); // 'draft' or 'transcript'
  const [isEditing, setIsEditing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  
  const [isImageChatOpen, setIsImageChatOpen] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [isCoverPreviewOpen, setIsCoverPreviewOpen] = useState(false);

  // Heimdall's QA report from generation (what the quality gate fixed).
  const [qaOpen, setQaOpen] = useState(false);

  // Brand Studio bridge: deep-link a studio template prefilled from this item.
  const [studioMenuOpen, setStudioMenuOpen] = useState(false);
  const articleTitle = (() => {
    const m = (item?.draft || '').match(/^#\s+(.+)$/m);
    return (m ? m[1] : item?.titles?.[0] || '').trim();
  })();
  const openInStudio = (template, extra = {}) => {
    setStudioMenuOpen(false);
    const params = new URLSearchParams({ template, brand: 'devfest', ...extra });
    window.open(`/brand-studio?${params.toString()}`, '_blank');
  };
  const STUDIO_TARGETS = [
    { template: 'blogcover', label: 'Blog Cover', hint: 'Design it, then save it as this article’s cover', extra: () => ({ title: articleTitle, date: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(), item: id }) },
    { template: 'quote', label: 'Quote Card', hint: 'One sharp line from the piece', extra: () => ({ title: articleTitle }) },
    { template: 'bignumber', label: 'Big Number', hint: 'The stat that carries it', extra: () => ({ title: articleTitle }) },
    { template: 'announcement', label: 'Announcement', hint: 'Tell the feed it exists', extra: () => ({ title: articleTitle }) },
  ];

  // Review workflow: draft -> finalized -> in_review -> approved -> published.
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [changesText, setChangesText] = useState('');
  const [changesOpen, setChangesOpen] = useState(false);
  const [deciding, setDeciding] = useState(false); // false | 'approve' | 'request_changes'
  const [requireReview, setRequireReview] = useState(false);

  const handleApproveImage = async (url) => {
    setIsImageChatOpen(false);
    const toastId = toast.loading('Saving cover image...');
    try {
      const res = await authFetch(`${API_BASE}/api/library/${id}/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(url.startsWith('data:') ? { imageData: url } : { imageUrl: url })
      });
      const data = await res.json();
      if (res.ok) {
        setCoverImage(`${API_BASE}${data.coverImage.url}`);
        setItem(prev => ({ ...prev, coverImage: data.coverImage }));
        toast.success('Cover image saved', { id: toastId });
      } else {
        toast.error(data.error || 'Failed to save cover image', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save cover image', { id: toastId });
    }
  };

  // Download the saved cover image as a file (fetch -> blob -> anchor click).
  const handleDownloadCover = async () => {
    if (!coverImage) return;
    try {
      const res = await fetch(coverImage);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const ext = (item?.coverImage?.contentType || blob.type || '').includes('png') ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cover-image.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Cover download failed:', err);
      toast.error('Could not download the cover image');
    }
  };

  useEffect(() => {
    authFetch(`${API_BASE}/api/library/item/${id}`)
      .then(res => res.json())
      .then(data => {
        setItem(data);
        setDraftContent(data.draft);
        if (data.coverImage?.url) setCoverImage(`${API_BASE}${data.coverImage.url}`);
        setLoading(false);
        // Whether this workspace gates publishing on reviewer approval.
        if (data.workspaceId) {
          authFetch(`${API_BASE}/api/workspaces`)
            .then(r => r.json())
            .then(ws => {
              const w = Array.isArray(ws) ? ws.find(x => x.id === data.workspaceId) : null;
              setRequireReview(!!w?.requireReview);
            })
            .catch(() => {});
        }
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  // Withdraw an active review request: back to finalized.
  const handleWithdraw = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/reviews/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, kind: 'article' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');
      setItem(prev => ({ ...prev, status: 'finalized' }));
      toast.success('Review withdrawn — back to finalized');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to withdraw the review');
    }
  };

  // Reviewer decision on an in_review draft: approve, or request changes with a
  // required comment (which also lands in the comment thread).
  const handleDecide = async (decision) => {
    if (deciding) return;
    if (decision === 'request_changes' && !changesText.trim()) {
      toast.error('Add a note explaining the requested changes.');
      return;
    }
    setDeciding(decision);
    try {
      const res = await authFetch(`${API_BASE}/api/reviews/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, kind: 'article', decision, comment: changesText.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record the decision');
      setItem(prev => ({ ...prev, status: data.reviewStatus }));
      setChangesOpen(false);
      setChangesText('');
      toast.success(decision === 'approve' ? 'Draft approved' : 'Changes requested — sent back to draft');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to record the decision');
    } finally {
      setDeciding(false);
    }
  };

  // Creator's "done editing" step. 'Approved' is reserved for reviewer approval.
  const handleSaveFinalize = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/library/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftContent })
      });
      if (res.ok) {
        setItem({ ...item, status: 'finalized', draft: draftContent });
        setIsEditing(false);
        toast.success('Draft finalized');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save draft');
    }
  };

  const handlePush = async () => {
    setIsPublishing(true);
    try {
      const res = await authFetch(`${API_BASE}/api/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryId: id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setItem({ ...item, status: 'published' });
      } else {
        toast.error(data.error || 'Failed to publish');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return <div className="py-6 text-sm text-slate-500">Loading item details...</div>;
  }

  if (!item) {
    return <div className="py-6 text-sm text-slate-500">Item not found.</div>;
  }

  // Lifecycle: draft -> finalized (creator done) -> in_review -> approved
  // (reviewer) -> published. Legacy items marked 'approved' predate the review
  // flow and are treated as reviewer-approved; 'pending_approval' is the legacy
  // name for a freshly generated draft.
  const status = item.status === 'pending_approval' ? 'draft' : (item.status || 'draft');
  // Reviewer rights are per-workspace.
  const userCanReview = canReview(item.workspaceId || workspaceId);
  // The review requester (or an admin) can manage/withdraw an active review.
  const canManageReview = isAdmin || (item.review?.requestedBy && item.review.requestedBy === user?.uid);
  const STATUS_BADGES = {
    draft: { variant: 'secondary', label: 'draft' },
    finalized: { variant: 'default', label: 'finalized' },
    in_review: { variant: 'warning', label: 'in review' },
    approved: { variant: 'success', label: 'approved' },
    published: { variant: 'success', label: 'published' },
  };
  const statusBadge = STATUS_BADGES[status] || { variant: 'warning', label: status.replace('_', ' ') };
  // Publishing: admin-only as before; where the workspace requires review, only
  // reviewer-approved (or already published) drafts may go out.
  const publishable = ['finalized', 'approved', 'published'].includes(status)
    && (!requireReview || ['approved', 'published'].includes(status));
  const awaitingApprovalForPublish = requireReview && ['finalized', 'in_review'].includes(status);

  return (
    <div className="flex flex-col pb-10">
      <div className="mb-4 flex items-center gap-5">
        <button
          onClick={() => navigate(`/workspace/${item.workspaceId}/library`)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 pr-5 border-r border-slate-200"
        >
          <ArrowLeft size={16} /> Back to Library
        </button>
        
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('draft')}
            className={`flex items-center gap-2 text-sm transition-colors hover:text-slate-900 ${
              activeTab === 'draft'
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <FileText size={16} /> Generated Draft
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 text-sm transition-colors hover:text-slate-900 ${
              activeTab === 'transcript'
                ? 'text-blue-600 font-semibold'
                : 'text-slate-500 font-medium'
            }`}
          >
            <Layers size={16} /> Sources
          </button>
        </div>
      </div>

      <Card className="flex flex-col rounded-xl bg-white">
        {activeTab === 'draft' ? (
          <div className="flex flex-col">
            <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#e8f0fe] px-6 py-2.5 border-b border-blue-100 rounded-t-xl">
              <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold text-slate-900">
                <Edit3 size={20} className="shrink-0 text-blue-600" />
                <span className="truncate">Draft Review</span>
                <Badge variant={statusBadge.variant} className="shrink-0 capitalize">
                  {statusBadge.label}
                </Badge>
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/workspace/${workspaceId}/library/item/${id}/social`)}
                  className="group relative text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700"
                >
                  <Share2 size={16} />
                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Syndicate Socials</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(draftContent).then(() => toast.success('Copied to clipboard!'))}
                  className="group relative text-teal-600 bg-teal-50 hover:bg-teal-100 hover:text-teal-700"
                >
                  <FileText size={16} />
                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Copy</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsImageChatOpen(true)}
                  className="group relative text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700"
                >
                  <ImageIcon size={16} />
                  <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Create Cover Image</span>
                </Button>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStudioMenuOpen(v => !v)}
                    className="group relative text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700"
                  >
                    <Palette size={16} />
                    {!studioMenuOpen && (
                      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Create Visual in Brand Studio</span>
                    )}
                  </Button>
                  {studioMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStudioMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-2">
                        <div className="px-4 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Create visual from this article</div>
                        {STUDIO_TARGETS.map(t => (
                          <button
                            key={t.template}
                            onClick={() => openInStudio(t.template, t.extra())}
                            className="w-full text-left px-4 py-2.5 hover:bg-violet-50 transition-colors"
                          >
                            <div className="text-sm font-semibold text-slate-800">{t.label}</div>
                            <div className="text-xs text-slate-400">{t.hint}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {isEditing ? (
                  <Button variant="ghost" size="icon" onClick={handleSaveFinalize} className="group relative text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700">
                    <Save size={16} />
                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Save & Finalize</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="group relative text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700">
                    <Edit3 size={16} />
                    <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">Edit Draft</span>
                  </Button>
                )}

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                {status === 'draft' && !isEditing && (
                  <Button variant="default" size="sm" onClick={handleSaveFinalize} className="rounded-lg px-5 font-semibold shadow-sm bg-blue-600 hover:bg-blue-700">
                    Finalize Draft
                  </Button>
                )}
                {status === 'finalized' && !isEditing && (
                  <Button size="sm" onClick={() => setReviewModalOpen(true)} className="rounded-lg px-5 font-semibold shadow-sm bg-amber-600 hover:bg-amber-700 text-white">
                    <UserCheck size={15} className="mr-1.5" /> Submit for review
                  </Button>
                )}
                {status === 'in_review' && userCanReview && !isEditing && (
                  <>
                    <Button size="sm" onClick={() => handleDecide('approve')} disabled={deciding !== false} className="rounded-lg px-5 font-semibold shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white">
                      {deciding === 'approve' ? <Loader2 size={15} className="mr-1.5 animate-spin" /> : <Check size={15} className="mr-1.5" />}
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChangesOpen(v => !v)} disabled={deciding !== false} className="rounded-lg px-4 font-semibold">
                      Request changes
                    </Button>
                  </>
                )}
                {status === 'in_review' && canManageReview && !isEditing && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)} className="rounded-lg px-4 font-semibold">
                      <UserCheck size={15} className="mr-1.5" /> Manage review
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleWithdraw} className="rounded-lg px-4 font-semibold text-slate-500 hover:text-slate-800">
                      Withdraw
                    </Button>
                  </>
                )}
                {isAdmin && publishable && (
                  <Button variant="success" size="sm" onClick={handlePush} disabled={isPublishing} className="rounded-lg px-5 font-semibold shadow-sm">
                    {isPublishing ? 'Publishing...' : (item.status === 'published' ? 'Update Sanity' : 'Publish to Website')}
                    <ExternalLink size={15} className="ml-1" />
                  </Button>
                )}
                {isAdmin && !publishable && awaitingApprovalForPublish && (
                  <Button variant="outline" size="sm" disabled title="This workspace requires reviewer approval before publishing" className="rounded-lg px-5 font-semibold opacity-60">
                    Publish — awaiting approval
                  </Button>
                )}
              </div>
            </div>

            {/* Reviewer's request-changes note (required; also posted to the thread). */}
            {changesOpen && status === 'in_review' && userCanReview && (
              <div className="border-b border-amber-100 bg-amber-50/60 px-6 py-3">
                <div className="flex items-start gap-2">
                  <textarea
                    value={changesText}
                    onChange={(e) => setChangesText(e.target.value)}
                    rows={2}
                    placeholder="What needs to change before this can be approved?"
                    className="flex-1 resize-none rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" onClick={() => handleDecide('request_changes')} disabled={deciding !== false || !changesText.trim()} className="bg-amber-600 hover:bg-amber-700 text-white">
                      {deciding === 'request_changes' ? <Loader2 size={14} className="animate-spin" /> : 'Send back'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setChangesOpen(false); setChangesText(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col flex-1 p-6">
              {coverImage && (
                <div className="group relative mb-6 w-full shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                  <div className="aspect-[21/9] w-full">
                    <img
                      src={coverImage}
                      alt="Article Cover"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={handleDownloadCover}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                      title="Download image"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCoverPreviewOpen(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white"
                      title="View full image"
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              )}

            {/* Heimdall's QA report: what the quality gate fixed at generation. */}
            {item.qaReport && (
              <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setQaOpen(v => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <ShieldCheck size={15} className="text-emerald-600" />
                    Heimdall reviewed this draft
                    <span className="hidden text-xs font-normal text-slate-400 sm:inline">
                      &middot; Odin&apos;s quality gate
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    {item.genUsage?.totalUsd != null && (
                      <span
                        className="text-xs tabular-nums text-slate-400"
                        title={Object.entries(item.genUsage.byAgent || {})
                          .map(([a, c]) => `${a}: $${c.toFixed(3)}`)
                          .join(' · ')}
                      >
                        ~${item.genUsage.totalUsd.toFixed(2)} to produce
                      </span>
                    )}
                    <ChevronDown size={15} className={`text-slate-400 transition-transform ${qaOpen ? 'rotate-180' : ''}`} />
                  </span>
                </button>
                {qaOpen && (
                  <div className="border-t border-slate-100 bg-white px-4 py-3">
                    <p className="mb-2 text-xs italic text-slate-400">
                      Heimdall is the watchman of the crew — after Oscar writes a draft, he checks
                      every claim against the source video, tightens the tone, and polishes the prose
                      before it reaches your library. Here is what he changed:
                    </p>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-600">{item.qaReport}</pre>
                  </div>
                )}
              </div>
            )}

            {isEditing ? (
              <div
                data-color-mode="light"
                className="flex-1 min-h-[420px] overflow-hidden"
              >
                <MDEditor
                  value={draftContent}
                  onChange={(val) => setDraftContent(val ?? '')}
                  height="100%"
                  preview="live"
                  visibleDragbar={false}
                  previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
                />
              </div>
            ) : (
              <div
                data-color-mode="light"
                className="flex-1 min-h-0"
              >
                <MDEditor.Markdown
                  source={draftContent}
                  rehypePlugins={[[rehypeSanitize]]}
                  style={{ background: 'transparent' }}
                />
              </div>
            )}

            {isCoverPreviewOpen && coverImage && (
              /* Above the sticky toolbar and every overlay, matching
                 the other full-screen surfaces (ImageChatModal, studio). */
              <div
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-6"
                onClick={() => setIsCoverPreviewOpen(false)}
              >
                <div className="absolute right-5 top-5 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDownloadCover(); }}
                    className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    title="Download image"
                  >
                    <Download size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCoverPreviewOpen(false)}
                    className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
                <img
                  src={coverImage}
                  alt="Cover full preview"
                  className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {isImageChatOpen && (
              <ImageChatModal
                onClose={() => setIsImageChatOpen(false)}
                draftContent={draftContent}
                initialPrompt={item.imagePrompt}
                onApproveImage={handleApproveImage}
                workspaceId={item.workspaceId}
              />
            )}

            {reviewModalOpen && (
              <SubmitReviewModal
                workspaceId={item.workspaceId || workspaceId}
                itemId={id}
                kind="article"
                channel={null}
                mode={status === 'in_review' ? 'update' : 'submit'}
                initialSelected={status === 'in_review' ? (item.review?.reviewers || []) : []}
                initialNote={status === 'in_review' ? (item.review?.note || '') : ''}
                onClose={() => setReviewModalOpen(false)}
                onSubmitted={({ reviewers, note }) => {
                  const wasUpdate = status === 'in_review';
                  setReviewModalOpen(false);
                  setItem(prev => ({
                    ...prev,
                    status: 'in_review',
                    review: { ...(prev.review || {}), reviewers, note, requestedBy: prev.review?.requestedBy || user?.uid },
                  }));
                  toast.success(wasUpdate ? 'Review updated — new reviewers notified' : 'Submitted for review — reviewers have been notified');
                }}
              />
            )}
            </div>
          </div>
        ) : (
          /* The Sources tab: one row per source (typed icon, title, link, size,
             expandable text where the item stored it per-source), plus the
             combined blob the writer actually consumed. Legacy items derive a
             YouTube row per url via sourcesOf. */
          <div className="flex flex-col">
            <div className="sticky top-0 z-30 bg-[#e8f0fe] px-6 py-4 border-b border-blue-100 rounded-t-xl">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Layers size={20} className="text-blue-600" />
                {(() => {
                  const srcs = sourcesOf(item);
                  return srcs.length === 1
                    ? sourceSummary(srcs)
                    : `${srcs.length} sources — ${sourceSummary(srcs)}`;
                })()}
              </h2>
            </div>
            <div className="flex flex-col divide-y divide-slate-100">
              {sourcesOf(item).map((s, i) => {
                const meta = metaOf(s.type);
                const Icon = meta.icon;
                return (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Icon size={17} className={`shrink-0 ${meta.accent}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{s.title || meta.label}</p>
                        <p className="text-xs text-slate-500">
                          {meta.label}
                          {s.chars ? ` · ${s.chars.toLocaleString()} characters` : ''}
                          {s.truncated ? ' · truncated at the source budget' : ''}
                        </p>
                      </div>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-auto shrink-0 text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
                        >
                          Open
                        </a>
                      )}
                    </div>
                    {s.text && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
                          Show source text
                        </summary>
                        <div className="mt-2 max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-700">
                          {s.text}
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
              {item.transcript && (
                <details className="px-6 py-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
                    Combined source text (what the writer consumed)
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                    {item.transcript}
                  </div>
                </details>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <CommentThread itemId={id} workspaceId={item.workspaceId || workspaceId} />
      </Card>
    </div>
  );
}
