import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import ConfirmDialog from './ui/confirm-dialog';
import SourceVault from './SourceVault';
import { Save, Briefcase, Cpu, Sparkles, Plus, Trash2, Megaphone, CheckCircle2, Database, Link2, Archive, ArchiveRestore, AlertTriangle, Loader2, Layers } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';
import toast from 'react-hot-toast';

// Workspace accent colors (dashboard card, header dot, sidebar marker,
// attention badges). Real Rep's emerald is the founding member.
const THEME_COLORS = ['#2563eb', '#10b981', '#f97316', '#7c3aed', '#e11d48', '#d97706', '#0d9488', '#475569'];

export default function WorkspaceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const isEditing = Boolean(id);
  const [activeTab, setActiveTab] = useState('general');
  const [isSaved, setIsSaved] = useState(false);

  // Danger zone: archive (reversible, admin) and delete (owner-only cascade).
  const [archiving, setArchiving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleToggleArchive = async () => {
    setArchiving(true);
    try {
      const res = await authFetch(`${API_BASE}/api/workspaces/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !formData.archived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update workspace');
      setFormData(prev => ({ ...prev, archived: data.archived }));
      toast.success(data.archived ? 'Workspace archived — no new content can be generated' : 'Workspace reopened');
    } catch (err) {
      toast.error(err.message || 'Failed to update workspace');
    } finally {
      setArchiving(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== formData.name) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_BASE}/api/workspaces/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete workspace');
      toast.success(`Workspace moved to trash — recoverable for ${data.retentionDays || 60} days from Global Settings`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace');
      setDeleting(false);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme: '#2563eb',
    destination: 'Markdown',
    sanityConnection: '',
    targetWebsite: '',
    aiProvider: 'Google',
    aiModel: 'gemini-3.1-pro-preview',
    systemPrompt: '',
    wordCount: '800-1200',
    primarySource: '',
    primaryOutput: '',
    socialPersonas: []
  });

  // The named Sanity connections the backend exposes (labels only, no tokens).
  const [sanityConnections, setSanityConnections] = useState([]);
  useEffect(() => {
    authFetch(`${API_BASE}/api/sanity/connections`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSanityConnections(data); })
      .catch(() => {});
  }, []);

  const TABS = [
    { id: 'general', label: 'Workspace Profile', icon: Briefcase },
    { id: 'engine', label: 'AI Engine & Integrations', icon: Cpu },
    { id: 'brand', label: 'Brand Voice', icon: Sparkles },
    { id: 'social', label: 'Social Profiles', icon: Megaphone },
    // The Source Vault (transcript ledger) lives here rather than the main
    // nav — reference material, not a daily surface.
    ...(isEditing ? [{ id: 'vault', label: 'Source Vault', icon: Layers }] : []),
    // Archive/delete get their own tab so they're always one click away, never
    // buried at the bottom of a scrolling pane.
    ...(isEditing ? [{ id: 'danger', label: 'Danger Zone', icon: AlertTriangle }] : [])
  ];

  useEffect(() => {
    if (isEditing) {
      authFetch(`${API_BASE}/api/workspaces`)
        .then(res => res.json())
        .then(data => {
          const ws = data.find(w => w.id === id || w._id === id);
          if (ws) {
            // Sanitize legacy 'Odin' provider since we removed it
            if (ws.aiProvider === 'Odin') {
              ws.aiProvider = 'Anthropic';
              ws.aiModel = 'claude-sonnet-5';
            }
            setFormData(prev => ({
              ...prev,
              socialPersonas: [],
              ...ws,
              primarySource: ws.primarySource || prev.primarySource || '',
              primaryOutput: ws.primaryOutput || prev.primaryOutput || '',
              targetWebsite: ws.targetWebsite || prev.targetWebsite || ''
            }));
          }
        })
        .catch(err => {
          console.error('Failed to fetch workspaces', err);
        });
    }
  }, [id, isEditing]);

  const addPersona = () => {
    setFormData({
      ...formData,
      socialPersonas: [
        ...(formData.socialPersonas || []),
        { id: crypto.randomUUID(), name: '', prompt: '', channels: ['linkedin', 'x'] }
      ]
    });
  };

  const updatePersona = (id, key, value) => {
    setFormData({
      ...formData,
      socialPersonas: (formData.socialPersonas || []).map(p => p.id === id ? { ...p, [key]: value } : p)
    });
  };

  const togglePersonaChannel = (id, channel) => {
    setFormData({
      ...formData,
      socialPersonas: (formData.socialPersonas || []).map(p => {
        if (p.id !== id) return p;
        const channels = p.channels || [];
        const newChannels = channels.includes(channel)
          ? channels.filter(c => c !== channel)
          : [...channels, channel];
        return { ...p, channels: newChannels };
      })
    });
  };

  // Removal is staged on the form (persisted on Save), but a persona's prompt
  // is hand-written work — confirm before dropping it from the form.
  const [confirmPersona, setConfirmPersona] = useState(null);

  const removePersona = (id) => {
    setFormData({
      ...formData,
      socialPersonas: (formData.socialPersonas || []).filter(p => p.id !== id)
    });
    setConfirmPersona(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    const endpoint = isEditing ? `${API_BASE}/api/workspaces/${id}` : `${API_BASE}/api/workspaces`;

    const toastId = toast.loading(isEditing ? 'Saving configuration...' : 'Creating workspace...');
    try {
      const res = await authFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        if (isEditing) {
          toast.success('Configuration saved', { id: toastId });
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        } else {
          toast.success('Workspace created', { id: toastId });
          const newWs = await res.json();
          navigate(`/workspace/${newWs.id || newWs._id}`);
        }
      } else {
        toast.error('Failed to save workspace', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving workspace', { id: toastId });
    }
  };

  return (
    <div className="w-[calc(100%+32px)] flex flex-col flex-1 min-h-0 -ml-6 -mr-2">
      <ConfirmDialog
        open={!!confirmPersona}
        title={`Remove "${confirmPersona?.name || 'this profile'}"?`}
        message="Its persona prompt is dropped from the form and gone for good once you save the workspace."
        confirmLabel="Remove profile"
        onConfirm={() => removePersona(confirmPersona.id)}
        onCancel={() => setConfirmPersona(null)}
      />

      <div className="flex flex-col md:flex-row flex-1 min-h-0 -mb-8 relative">
        {/* Vertical Tab Navigation */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1.5 border-r border-slate-200 pr-6 pl-4 -mt-4 pt-8 bg-white z-10 shadow-[4px_0_6px_-1px_rgb(0,0,0,0.05)]">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? (tab.id === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700')
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? (tab.id === 'danger' ? 'text-rose-600' : 'text-blue-600') : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0 pl-4 flex flex-col">
          <form id="workspace-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col space-y-6 w-full pb-[89px]">
            
            {activeTab === 'general' && (
                
              <Card className="border-slate-200 shadow-sm flex-1 min-h-0">
                  <CardHeader className="border-b border-slate-100 bg-slate-50">
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Briefcase size={18} />
                      </span>
                      Workspace Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col pt-6 gap-6 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="ws-name">Workspace Name</Label>
                        <Input
                          id="ws-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. The Real Rep Substack Blogs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ws-wc">Target Word Count</Label>
                        <Input
                          id="ws-wc"
                          type="text"
                          value={formData.wordCount || ''}
                          onChange={e => setFormData({ ...formData, wordCount: e.target.value })}
                          placeholder="e.g. 800-1200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ws-source">Primary Source</Label>
                        <Input
                          id="ws-source"
                          type="text"
                          value={formData.primarySource || ''}
                          onChange={e => setFormData({ ...formData, primarySource: e.target.value })}
                          placeholder="e.g. YouTube Transcripts, Web Scraping"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="ws-output">Final Content Output</Label>
                        <Input
                          id="ws-output"
                          type="text"
                          value={formData.primaryOutput || ''}
                          onChange={e => setFormData({ ...formData, primaryOutput: e.target.value })}
                          placeholder="e.g. SEO Blog Post, Newsletter"
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col space-y-1.5">
                      <Label htmlFor="ws-desc">Description</Label>
                      <Textarea
                        id="ws-desc"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Short description of the brand or goal"
                        className="flex-1 resize-none min-h-[100px]"
                      />
                    </div>

                    {/* Workspace color: tints the dashboard card, header dot,
                        sidebar marker, and attention badges for this workspace. */}
                    <div className="space-y-1.5">
                      <Label>Workspace color</Label>
                      <div className="flex items-center gap-2.5">
                        {THEME_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={`Workspace color ${c}`}
                            onClick={() => setFormData({ ...formData, theme: c })}
                            className={`size-7 rounded-full transition-transform hover:scale-110 ${
                              formData.theme === c ? 'ring-2 ring-slate-400 ring-offset-2' : ''
                            }`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review gate: where on, articles must be reviewer-approved
                        before publishing; social pieces carry an awaiting-review
                        state until approved. Creators are never blocked from
                        creating/finalizing/downloading. */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Require review before publishing</p>
                        <p className="mt-1 text-xs text-slate-500 max-w-lg">
                          Finalized content must be submitted to a reviewer and approved before articles can publish to the website.
                          Creators can still generate, edit, finalize, and download everything.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={!!formData.requireReview}
                          onChange={e => setFormData({ ...formData, requireReview: e.target.checked })}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-amber-500 peer-checked:after:translate-x-full" />
                      </label>
                    </div>

                  </CardContent>
                </Card>
            )}

            {/* Danger Zone tab: archive (reversible, admin) and delete (owner-only,
                to the 60-day trash). Its own tab so it can never be buried. */}
            {activeTab === 'vault' && isEditing && (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                <SourceVault />
              </div>
            )}

            {activeTab === 'danger' && isEditing && (
              <Card className="border-rose-200 shadow-sm flex-1 min-h-0">
                <CardHeader className="border-b border-rose-100 bg-rose-50/50">
                  <CardTitle className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                      <AlertTriangle size={18} />
                    </span>
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 min-h-0 overflow-y-auto">
                  <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white max-w-3xl">
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {formData.archived ? 'Reopen this workspace' : 'Archive this workspace'}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 max-w-lg">
                          {formData.archived
                            ? 'Archived: no new content can be generated. Reopening restores it fully.'
                            : 'Closes the workspace: it stays visible with all its content, but no new content can be generated. Reversible.'}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={handleToggleArchive} disabled={archiving} className="shrink-0">
                        {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : formData.archived
                          ? <><ArchiveRestore className="mr-1.5 h-4 w-4" /> Reopen</>
                          : <><Archive className="mr-1.5 h-4 w-4" /> Archive</>}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Delete this workspace</p>
                        <p className="mt-0.5 text-xs text-slate-500 max-w-lg">
                          Moves the workspace and all its content to the trash, hidden from the app.
                          After 60 days it is purged permanently; until then an owner can restore it
                          from Global Settings.
                          {!isOwner && ' Only an owner can do this.'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => { setDeleteConfirmText(''); setDeleteOpen(true); }}
                        disabled={!isOwner}
                        title={isOwner ? undefined : 'Owner privileges required'}
                        className="shrink-0"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Type-to-confirm delete modal. */}
                  {deleteOpen && (
                    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => !deleting && setDeleteOpen(false)}>
                      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                          <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-rose-100">
                            <Trash2 className="h-5 w-5 text-rose-600" />
                          </div>
                          <h2 className="text-lg font-semibold text-slate-900">Delete "{formData.name}"?</h2>
                          <p className="mt-2 text-sm text-slate-600">
                            The workspace and <strong>everything in it</strong> moves to the trash and disappears
                            from the app. An owner can restore it from Global Settings for <strong>60 days</strong>;
                            after that it is purged permanently.
                          </p>
                          <p className="mt-4 text-xs font-medium text-slate-500">
                            Type <span className="font-bold text-slate-800">{formData.name}</span> to confirm:
                          </p>
                          <Input
                            value={deleteConfirmText}
                            onChange={e => setDeleteConfirmText(e.target.value)}
                            placeholder={formData.name}
                            className="mt-2"
                            autoFocus
                          />
                          <div className="mt-5 flex justify-end gap-3">
                            <Button type="button" variant="ghost" disabled={deleting} onClick={() => setDeleteOpen(false)}>
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              disabled={deleteConfirmText !== formData.name || deleting}
                              onClick={handleDeleteWorkspace}
                            >
                              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete workspace'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'engine' && (
                
              <Card className="border-slate-200 shadow-sm flex-1 min-h-0">
                  <CardHeader className="border-b border-slate-100 bg-slate-50">
                    <CardTitle className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Cpu size={18} />
                      </span>
                      AI Engine & Integrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 flex flex-col gap-8 pt-6 overflow-y-auto">
                    {/* Publishing Integrations */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Publishing Destination</h3>
                      {/* Workspaces reference one of the named Sanity connections
                          (or none: drafts stay in the library). The connections
                          themselves are configured server-side — one per website. */}
                      <div className="max-w-md space-y-1.5">
                        <Label>Website connection</Label>
                        <Select
                          value={formData.sanityConnection || ''}
                          onChange={e => {
                            const key = e.target.value;
                            const conn = sanityConnections.find(c => c.key === key);
                            setFormData({
                              ...formData,
                              sanityConnection: key,
                              destination: conn ? 'Sanity' : 'Markdown',
                              targetWebsite: conn ? conn.label : '',
                            });
                          }}
                        >
                          <option value="">None — drafts stay in the library</option>
                          {sanityConnections.map(c => (
                            <option key={c.key} value={c.key}>{c.label} (Sanity)</option>
                          ))}
                        </Select>
                        <p className="text-xs text-slate-500">Where "Publish to Website" sends approved articles.</p>
                      </div>
                      {formData.sanityConnection ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                              <Database size={24} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <h4 className="font-semibold text-slate-800">Sanity CMS</h4>
                              <div className="flex items-center gap-1.5 text-sm">
                                <Link2 size={14} className="text-emerald-600" />
                                <span className="text-emerald-700 font-medium">
                                  {sanityConnections.find(c => c.key === formData.sanityConnection)?.label || formData.sanityConnection}
                                </span>
                                <span className="text-slate-400">
                                  · {sanityConnections.find(c => c.key === formData.sanityConnection)?.schemaType}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-sm font-medium shrink-0">
                            <CheckCircle2 size={16} />
                            Connected
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                          No website connection — articles can be drafted, reviewed, and approved, but not published from here.
                        </div>
                      )}
                    </div>

                    {/* AI Config */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">AI Configuration</h3>
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label>AI Provider</Label>
                          <Select
                            value={formData.aiProvider}
                            onChange={e => {
                              const aiProvider = e.target.value;
                              let aiModel = formData.aiModel;
                              if (aiProvider === 'Anthropic') aiModel = 'claude-sonnet-5';
                              if (aiProvider === 'Google') aiModel = 'gemini-3.1-pro-preview';
                              setFormData({ ...formData, aiProvider, aiModel });
                            }}
                          >
                            <option value="Google">Google (Gemini)</option>
                            <option value="Anthropic">Anthropic (Claude)</option>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label>AI Model</Label>
                          <Select
                            value={formData.aiModel}
                            onChange={e => setFormData({ ...formData, aiModel: e.target.value })}
                          >
                            {formData.aiProvider === 'Anthropic' && (
                              <>
                                <option value="claude-sonnet-5">Claude 5 Sonnet (Frontier)</option>
                                <option value="claude-sonnet-4-6">Claude 4.6 Sonnet</option>
                              </>
                            )}
                            {formData.aiProvider === 'Google' && (
                              <>
                                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                                <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
                                <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
                              </>
                            )}
                          </Select>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            Select the exact model architecture for generation.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}

            {activeTab === 'brand' && (
              
              
              <Card className="border-slate-200 shadow-sm flex-1 min-h-0">
                <CardHeader className="border-b border-slate-100 bg-slate-50">
                  <CardTitle className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                      <Sparkles size={18} />
                    </span>
                    Workspace Persona
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex-1 min-h-0 overflow-y-auto">
                  <div className="mb-1.5 flex items-center justify-between">
                    <Label>System Prompt</Label>
                    <span className="text-xs text-slate-400">Supports Markdown styling instructions</span>
                  </div>
                  <Textarea
                    required
                    rows={10}
                    value={formData.systemPrompt}
                    onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                    placeholder={"PERSONA: THE OPERATOR\n\nVoice: First-person, unfiltered, gritty...\n\nRules:\n- Never use the word 'delve'\n- Always start with a hook"}
                    className="resize-y border-slate-700 bg-slate-900 font-mono text-[13px] leading-relaxed text-slate-100 shadow-inner placeholder:text-slate-500 hover:border-slate-600 focus-visible:border-blue-500 focus-visible:ring-blue-500/30"
                  />
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    This is the core intelligence of your pipeline. Every piece of content generated in this
                    workspace will strictly adhere to the voice, style, and rules defined here.
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'social' && (
              
              
              <Card className="border-slate-200 shadow-sm flex-1 min-h-0">
                <CardHeader className="border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Megaphone size={18} />
                    </span>
                    Social Media Profiles
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addPersona} className="flex items-center gap-2">
                    <Plus size={16} /> Add Profile
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-6 flex-1 min-h-0 overflow-y-auto">
                  {(!formData.socialPersonas || formData.socialPersonas.length === 0) ? (
                    <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      No social profiles defined. Writers will use default options.
                    </div>
                  ) : (
                    <div className="space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 pb-4">
                      {formData.socialPersonas.map((persona) => (
                        <div key={persona.id} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm relative space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1.5 w-1/2">
                              <Label>Profile Name</Label>
                              <Input
                                type="text"
                                value={persona.name}
                                onChange={(e) => updatePersona(persona.id, 'name', e.target.value)}
                                placeholder="e.g. John Doe - Technical Founder"
                                className="bg-slate-50"
                              />
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 mt-6"
                              onClick={() => setConfirmPersona(persona)}
                              title="Remove Profile"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label>Supported Channels</Label>
                            <div className="flex flex-wrap gap-3">
                              {['linkedin', 'x', 'instagram', 'facebook', 'tiktok'].map(channel => (
                                <label key={channel} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                    checked={(persona.channels || []).includes(channel)}
                                    onChange={() => togglePersonaChannel(persona.id, channel)}
                                  />
                                  <span className="capitalize">{channel === 'x' ? 'X (Twitter)' : channel}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label>Voice & Instructions</Label>
                            <Textarea
                              rows={4}
                              value={persona.prompt}
                              onChange={(e) => updatePersona(persona.id, 'prompt', e.target.value)}
                              placeholder="Define the specific tone, constraints, emojis to use, formatting preferences..."
                              className="resize-y text-sm bg-slate-50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </form>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-8 py-4 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/')}>
          Discard Changes
        </Button>
        <Button type="submit" form="workspace-form" size="sm" className="rounded-full shadow-sm">
          {isSaved ? (
            <><CheckCircle2 size={18} className="mr-2" /> Saved!</>
          ) : (
            <><Save size={18} className="mr-2" /> {isEditing ? 'Save Changes' : 'Create Workspace'}</>
          )}
        </Button>
      </div>

    </div>
  );
}
