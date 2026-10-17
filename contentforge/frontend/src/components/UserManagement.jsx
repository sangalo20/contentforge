import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, KeyRound, Loader2, MoreHorizontal, Mail, Layers, Clock, UserCheck, ArchiveRestore, Flame, ArrowLeft, Users as UsersIcon, CircleDollarSign, Link2 } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';
import UsageCost from './UsageCost';
import IntegrationsPanel from './IntegrationsPanel';
import ApiKeysPanel from './ApiKeysPanel';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select } from './ui/select';
import ConfirmDialog from './ui/confirm-dialog';
import { Button } from './ui/button';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser, isAdmin, isOwner } = useAuth();
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  // Non-admins never load anything, so they start (and stay) not-loading.
  const [loading, setLoading] = useState(isAdmin);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('creator');
  const [accessMode, setAccessMode] = useState('specific'); // 'all' | 'specific'
  const [accessIds, setAccessIds] = useState([]);
  // Reviewer grants are per-workspace and opt-in ('none' | 'all' | 'specific').
  const [reviewMode, setReviewMode] = useState('none');
  const [reviewIds, setReviewIds] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [menuOpenFor, setMenuOpenFor] = useState(null);

  // Access editor modal state.
  const [editingUser, setEditingUser] = useState(null);
  const [editAccessMode, setEditAccessMode] = useState('all');
  const [editAccessIds, setEditAccessIds] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);

  // Reviewer editor modal state.
  const [editingReviewer, setEditingReviewer] = useState(null);
  const [editReviewMode, setEditReviewMode] = useState('none');
  const [editReviewIds, setEditReviewIds] = useState([]);
  const [savingReviewer, setSavingReviewer] = useState(false);

  // Generic confirmation dialog: { title, message, confirmLabel, onConfirm }.
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const runConfirm = async () => {
    if (!confirmDialog) return;
    setConfirmBusy(true);
    try {
      await confirmDialog.onConfirm();
    } finally {
      setConfirmBusy(false);
      setConfirmDialog(null);
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClick = () => setMenuOpenFor(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const workspaceName = (id) => workspaces.find(w => w.id === id)?.name || id;

  // Owner is grantable only by an owner — except the bootstrap case: until any
  // owner exists, an admin may assign the first one (the server enforces this too).
  const anyOwner = users.some(u => u.role === 'owner');
  const canGrantOwner = isOwner || !anyOwner;
  const ownersCount = users.filter(u => u.role === 'owner').length;

  // Human-readable summary of a user's workspace access.
  const accessLabel = (access) => {
    if (access === 'all' || access === undefined || access === null) return 'All workspaces';
    if (!Array.isArray(access) || access.length === 0) return 'No workspaces';
    const names = access.map(workspaceName);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  // Human-readable summary of a user's reviewer grants (opt-in: absent = none).
  const reviewerLabel = (rw) => {
    if (rw === 'all') return 'All workspaces';
    if (!Array.isArray(rw) || rw.length === 0) return 'None';
    const names = rw.map(workspaceName);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  };

  const loadUsers = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/users`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaces = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/workspaces`);
      const data = await res.json();
      if (res.ok) setWorkspaces(data);
    } catch {
      // Non-fatal: the access selector just shows nothing to pick.
    }
  };

  const loadInvites = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/invites`);
      const data = await res.json();
      if (res.ok) setInvites(data);
    } catch {
      // Non-fatal.
    }
  };

  // Workspace trash: deleted workspaces held for the retention window before
  // permanent purge. Admins see it; owners can restore or purge early.
  const [trash, setTrash] = useState({ retentionDays: 60, trashed: [] });
  // Admin page tabs: team management, workspace trash, AI usage & cost.
  const [activeTab, setActiveTab] = useState(isAdmin ? 'team' : 'integrations');
  const loadTrash = async () => {
    try {
      const res = await authFetch(`${API_BASE}/api/workspaces-trash`);
      const data = await res.json();
      if (res.ok) setTrash(data);
    } catch {
      // Non-fatal.
    }
  };

  const handleRestoreWorkspace = async (w) => {
    const toastId = toast.loading(`Restoring "${w.name}"...`);
    try {
      const res = await authFetch(`${API_BASE}/api/workspaces/${w.id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to restore');
      toast.success(`"${w.name}" restored`, { id: toastId });
      await Promise.all([loadTrash(), loadWorkspaces()]);
    } catch (err) {
      toast.error(err.message || 'Failed to restore the workspace', { id: toastId });
    }
  };

  const confirmPurgeWorkspace = (w) => {
    setConfirmDialog({
      title: 'Purge workspace now',
      message: `Permanently purge "${w.name}" and all of its content right now, without waiting for the ${trash.retentionDays}-day window? This cannot be undone.`,
      confirmLabel: 'Purge forever',
      onConfirm: async () => {
        const toastId = toast.loading(`Purging "${w.name}"...`);
        try {
          const res = await authFetch(`${API_BASE}/api/workspaces/${w.id}?purge=true`, { method: 'DELETE' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to purge');
          toast.success(`"${w.name}" purged (${data.deletedItems} items removed)`, { id: toastId });
          await loadTrash();
        } catch (err) {
          toast.error(err.message || 'Failed to purge the workspace', { id: toastId });
        }
      },
    });
  };

  useEffect(() => {
    if (!isAdmin) return;
    // Schedule the loads instead of calling into setState-bearing code
    // synchronously from the effect body (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      loadUsers();
      loadWorkspaces();
      loadInvites();
      loadTrash();
    }, 0);
    return () => clearTimeout(t);
  }, [isAdmin]);

  const copyLink = async (link) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard');
    } catch {
      toast(link, { duration: 10000 });
    }
  };

  const openInvite = () => {
    setEmail('');
    setRole('creator');
    setAccessMode('specific');
    setAccessIds([]);
    setReviewMode('none');
    setReviewIds([]);
    setShowInvite(true);
  };

  const toggleAccessId = (id, ids, setIds) => {
    setIds(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const workspaceAccess = accessMode === 'all' ? 'all' : accessIds;
    if (accessMode === 'specific' && accessIds.length === 0) {
      toast.error('Pick at least one workspace, or choose entire app');
      return;
    }
    if (reviewMode === 'specific' && reviewIds.length === 0) {
      toast.error('Pick at least one workspace to review, or choose None');
      return;
    }
    const reviewerWorkspaces = reviewMode === 'all' ? 'all' : reviewMode === 'specific' ? reviewIds : [];
    setInviting(true);
    const toastId = toast.loading('Creating user...');
    try {
      const res = await authFetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role, workspaceAccess, reviewerWorkspaces }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.emailSent ? `Invite sent to ${data.email} (valid 7 days)` : `Invite created for ${data.email}`, { id: toastId });
        setShowInvite(false);
        await loadInvites();
        // If email couldn't be sent (Resend not configured), fall back to clipboard.
        if (!data.emailSent && data.acceptLink) copyLink(data.acceptLink);
      } else {
        toast.error(data.error || 'Failed to invite user', { id: toastId });
      }
    } catch {
      toast.error('Failed to invite user', { id: toastId });
    } finally {
      setInviting(false);
    }
  };

  const openAccessEditor = (u) => {
    const isAll = u.workspaceAccess === 'all' || u.workspaceAccess === undefined || u.workspaceAccess === null;
    setEditingUser(u);
    setEditAccessMode(isAll ? 'all' : 'specific');
    setEditAccessIds(isAll ? [] : [...u.workspaceAccess]);
  };

  const handleSaveAccess = async (e) => {
    e.preventDefault();
    const workspaceAccess = editAccessMode === 'all' ? 'all' : editAccessIds;
    if (editAccessMode === 'specific' && editAccessIds.length === 0) {
      toast.error('Pick at least one workspace, or choose entire app');
      return;
    }
    setSavingAccess(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users/${editingUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceAccess }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Access updated for ${editingUser.email}`);
        setUsers(users.map(u => (u.uid === editingUser.uid ? { ...u, workspaceAccess } : u)));
        setEditingUser(null);
      } else {
        toast.error(data.error || 'Failed to update access');
      }
    } catch {
      toast.error('Failed to update access');
    } finally {
      setSavingAccess(false);
    }
  };

  const openReviewerEditor = (u) => {
    const rw = u.reviewerWorkspaces;
    setEditingReviewer(u);
    if (rw === 'all') { setEditReviewMode('all'); setEditReviewIds([]); }
    else if (Array.isArray(rw) && rw.length > 0) { setEditReviewMode('specific'); setEditReviewIds([...rw]); }
    else { setEditReviewMode('none'); setEditReviewIds([]); }
  };

  const handleSaveReviewer = async (e) => {
    e.preventDefault();
    if (editReviewMode === 'specific' && editReviewIds.length === 0) {
      toast.error('Pick at least one workspace to review, or choose None');
      return;
    }
    const reviewerWorkspaces = editReviewMode === 'all' ? 'all' : editReviewMode === 'specific' ? editReviewIds : [];
    setSavingReviewer(true);
    try {
      const res = await authFetch(`${API_BASE}/api/users/${editingReviewer.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerWorkspaces }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Reviewer grants updated for ${editingReviewer.email}`);
        setUsers(users.map(u => (u.uid === editingReviewer.uid ? { ...u, reviewerWorkspaces, ...(data.role ? { role: data.role } : {}) } : u)));
        setEditingReviewer(null);
      } else {
        toast.error(data.error || 'Failed to update reviewer grants');
      }
    } catch {
      toast.error('Failed to update reviewer grants');
    } finally {
      setSavingReviewer(false);
    }
  };

  const handleRevokeInvite = async (inv) => {
    const prev = invites;
    setInvites(invites.filter(i => i.id !== inv.id));
    try {
      const res = await authFetch(`${API_BASE}/api/invites/${inv.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Invite revoked');
      } else {
        setInvites(prev);
        toast.error('Failed to revoke invite');
      }
    } catch {
      setInvites(prev);
      toast.error('Failed to revoke invite');
    }
  };

  const confirmRevokeInvite = (inv) => {
    setConfirmDialog({
      title: 'Revoke invite',
      message: `Revoke the pending invite for ${inv.email}? The link they received will stop working.`,
      confirmLabel: 'Revoke invite',
      onConfirm: () => handleRevokeInvite(inv),
    });
  };

  const handleRoleChange = async (uid, newRole) => {
    const prev = users;
    setUsers(users.map(u => (u.uid === uid ? { ...u, role: newRole } : u)));
    try {
      const res = await authFetch(`${API_BASE}/api/users/${uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Role updated to ${newRole}`);
      } else {
        setUsers(prev);
        toast.error(data.error || 'Failed to update role');
      }
    } catch {
      setUsers(prev);
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (u) => {
    const toastId = toast.loading('Removing user...');
    try {
      const res = await authFetch(`${API_BASE}/api/users/${u.uid}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('User removed', { id: toastId });
        setUsers(users.filter(x => x.uid !== u.uid));
      } else {
        toast.error(data.error || 'Failed to remove user', { id: toastId });
      }
    } catch {
      toast.error('Failed to remove user', { id: toastId });
    }
  };

  const confirmDelete = (u) => {
    setConfirmDialog({
      title: 'Remove user',
      message: `Remove ${u.email}? This deletes their login and ContentForge access. This cannot be undone.`,
      confirmLabel: 'Remove user',
      onConfirm: () => handleDelete(u),
    });
  };

  const handleResetLink = async (u) => {
    const toastId = toast.loading('Generating link...');
    try {
      const res = await authFetch(`${API_BASE}/api/users/${u.uid}/reset-link`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.dismiss(toastId);
        if (data.emailSent) toast.success(`Reset email sent to ${u.email}`);
        else copyLink(data.resetLink);
      } else {
        toast.error(data.error || 'Failed to generate link', { id: toastId });
      }
    } catch {
      toast.error('Failed to generate link', { id: toastId });
    }
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center text-sm text-slate-500">
        You need admin privileges to manage users.
      </div>
    );
  }

  // Radio-style "Entire app" vs "Specific workspaces" picker, reused by the
  // invite modal and the access editor modal.
  const renderAccessSelector = (mode, setMode, ids, setIds) => (
    <div className="space-y-2">
      <Label className="text-slate-700">Workspace access</Label>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode('all')}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === 'all' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          Entire app
        </button>
        <button
          type="button"
          onClick={() => setMode('specific')}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === 'specific' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          Specific workspaces
        </button>
      </div>
      {mode === 'specific' && (
        <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {workspaces.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-400">No workspaces available.</p>
          ) : (
            workspaces.map(w => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={ids.includes(w.id)}
                  onChange={() => toggleAccessId(w.id, ids, setIds)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-400"
                />
                <span className="text-slate-700">{w.name}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Three-mode reviewer picker: None / All / Specific. Reviewer grants are
  // opt-in and per-workspace; admins get no implicit review power.
  const renderReviewerSelector = (mode, setMode, ids, setIds) => (
    <div className="space-y-2">
      <Label className="text-slate-700">Reviews content in</Label>
      <div className="grid grid-cols-3 gap-2">
        {[['none', 'None'], ['all', 'All workspaces'], ['specific', 'Specific']].map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === m ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === 'specific' && (
        <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-2">
          {workspaces.length === 0 ? (
            <p className="px-2 py-3 text-xs text-slate-400">No workspaces available.</p>
          ) : (
            workspaces.map(w => (
              <label key={w.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={ids.includes(w.id)}
                  onChange={() => toggleAccessId(w.id, ids, setIds)}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                />
                <span className="text-slate-700">{w.name}</span>
              </label>
            ))
          )}
        </div>
      )}
      <p className="text-xs text-slate-500">Reviewers approve content submitted for review. They can only review workspaces they can access.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-[900px]">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{isAdmin ? 'Admin' : 'Settings'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Team, invites, reviewer grants, workspace trash, AI usage, and your integrations. Owners can delete workspaces; Admins manage users & config; Creators generate and edit drafts.'
              : 'Your personal settings — connect your own accounts under Integrations.'}
          </p>
        </div>
        {activeTab === 'team' && (
          <Button onClick={openInvite} className="rounded-xl px-5 font-semibold shadow-sm">
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
          </Button>
        )}
      </div>

      {/* Tabs — admin tabs are hidden from non-admins, who land on their
          personal Integrations tab. */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {[
          ...(isAdmin ? [
            { id: 'team', label: 'Team', icon: UsersIcon, badge: users.length },
            { id: 'trash', label: 'Workspace Trash', icon: Trash2, badge: trash.trashed.length },
            { id: 'usage', label: 'Usage & Cost', icon: CircleDollarSign, badge: 0 },
            { id: 'apikeys', label: 'API Keys', icon: KeyRound, badge: 0 },
          ] : []),
          { id: 'integrations', label: 'Integrations', icon: Link2, badge: 0 },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === t.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <t.icon size={15} className={activeTab === t.id ? 'text-blue-600' : 'text-slate-400'} />
            {t.label}
            {t.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                activeTab === t.id ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Invite Modal Overlay */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Invite a Team Member</h2>
              <p className="text-xs text-slate-500">They will receive an email to set their password.</p>
            </div>
            <form onSubmit={handleInvite} className="p-6">
              <div className="mb-4 space-y-1.5">
                <Label htmlFor="invite-email" className="text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teammate@company.com"
                    autoFocus
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="mb-4 space-y-1.5">
                <Label htmlFor="invite-role" className="text-slate-700">Role</Label>
                <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-white">
                  <option value="creator">Creator (can generate & edit)</option>
                  <option value="admin">Admin (can manage users & config)</option>
                  <option value="owner" disabled={!canGrantOwner}>Owner (admin + can delete workspaces)</option>
                 </Select>
              </div>
              <div className="mb-4">
                {renderAccessSelector(accessMode, setAccessMode, accessIds, setAccessIds)}
              </div>
              <div className="mb-8">
                {renderReviewerSelector(reviewMode, setReviewMode, reviewIds, setReviewIds)}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowInvite(false)} className="text-slate-500 hover:text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={inviting} className="min-w-[100px]">
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Manage Workspace Access</h2>
              <p className="truncate text-xs text-slate-500">{editingUser.email}</p>
            </div>
            <form onSubmit={handleSaveAccess} className="p-6">
              <div className="mb-8">
                {renderAccessSelector(editAccessMode, setEditAccessMode, editAccessIds, setEditAccessIds)}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={savingAccess} className="min-w-[100px]">
                  {savingAccess ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Access'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviewer Editor Modal */}
      {editingReviewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={() => setEditingReviewer(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">Manage Reviewer Grants</h2>
              <p className="truncate text-xs text-slate-500">{editingReviewer.email}</p>
            </div>
            <form onSubmit={handleSaveReviewer} className="p-6">
              <div className="mb-8">
                {renderReviewerSelector(editReviewMode, setEditReviewMode, editReviewIds, setEditReviewIds)}
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setEditingReviewer(null)} className="text-slate-500 hover:text-slate-700">
                  Cancel
                </Button>
                <Button type="submit" disabled={savingReviewer} className="min-w-[100px]">
                  {savingReviewer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Grants'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog (shared component — see ui/confirm-dialog.jsx) */}
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        busy={confirmBusy}
        onConfirm={runConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      {activeTab === 'team' && (<>
      {/* Main Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 items-center border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div className="col-span-3">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Access</div>
          <div className="col-span-2">Reviews In</div>
          <div className="col-span-2">Last Active</div>
          <div className="col-span-1 text-right"></div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = u.uid === currentUser?.uid;
              const isMenuOpen = menuOpenFor === u.uid;
              
              return (
                <div key={u.uid} className="group grid grid-cols-12 items-center px-6 py-3.5 transition-colors hover:bg-slate-50/50">
                  
                  {/* User Col */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100/50 text-sm font-bold uppercase text-blue-700 ring-1 ring-blue-100">
                      {(u.email || '?').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium text-slate-900">{u.email}</span>
                        {isSelf && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">You</span>}
                      </div>
                      <span className="text-xs text-slate-400">ID: {u.uid.slice(0, 10)}...</span>
                    </div>
                  </div>

                  {/* Role Col (legacy 'reviewer' displays as creator; its review
                      power shows in the Reviews In column). Your own row stays
                      editable — only the moves the server forbids are disabled:
                      self-demotion below admin, and the last owner stepping down. */}
                  <div className="col-span-2 pr-4">
                    <Select
                      value={u.role === 'reviewer' ? 'creator' : u.role}
                      onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                      className="h-8 border-transparent bg-transparent text-sm hover:border-slate-200 hover:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                    >
                      <option value="creator" disabled={isSelf}>Creator</option>
                      <option value="admin" disabled={isSelf && u.role === 'owner' && ownersCount <= 1}>Admin</option>
                      <option value="owner" disabled={!canGrantOwner}>Owner</option>
                    </Select>
                  </div>

                  {/* Access Col */}
                  <div className="col-span-2 pr-4">
                    <button
                      onClick={() => openAccessEditor(u)}
                      title="Manage workspace access"
                      className="group/access flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-slate-600 transition-colors hover:bg-slate-100"
                    >
                      <Layers size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{accessLabel(u.workspaceAccess)}</span>
                    </button>
                  </div>

                  {/* Reviews In Col */}
                  <div className="col-span-2 pr-4">
                    <button
                      onClick={() => openReviewerEditor(u)}
                      title="Manage reviewer grants"
                      className={`flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-slate-100 ${reviewerLabel(u.reviewerWorkspaces) === 'None' ? 'text-slate-400' : 'text-amber-700'}`}
                    >
                      <UserCheck size={14} className="shrink-0 opacity-70" />
                      <span className="truncate">{reviewerLabel(u.reviewerWorkspaces)}</span>
                    </button>
                  </div>

                  {/* Last Active Col */}
                  <div className="col-span-2 text-sm text-slate-500">
                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : <span className="italic text-slate-400">Never</span>}
                  </div>

                  {/* Actions Col */}
                  <div className="col-span-1 flex justify-end relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpenFor(isMenuOpen ? null : u.uid); }}
                      className="flex size-8 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all hover:bg-slate-200 hover:text-slate-800 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setMenuOpenFor(null); openAccessEditor(u); }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <Layers size={15} className="text-slate-400" /> Manage Access
                        </button>
                        <button
                          onClick={() => { setMenuOpenFor(null); openReviewerEditor(u); }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <UserCheck size={15} className="text-slate-400" /> Reviewer Grants
                        </button>
                        <button
                          onClick={() => { setMenuOpenFor(null); handleResetLink(u); }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          <KeyRound size={15} className="text-slate-400" /> Send Password Reset
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => { setMenuOpenFor(null); confirmDelete(u); }}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                          >
                            <Trash2 size={15} className="text-rose-500" /> Remove User
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Pending Invites</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100/60 text-amber-700 ring-1 ring-amber-100">
                  <Mail size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">{inv.email}</div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                    <span className="capitalize">{inv.role}</span>
                    <span>·</span>
                    <span>{accessLabel(inv.workspaceAccess)}</span>
                    {reviewerLabel(inv.reviewerWorkspaces) !== 'None' && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600">Reviews: {reviewerLabel(inv.reviewerWorkspaces)}</span>
                      </>
                    )}
                    {inv.expiresAt && (
                      <>
                        <span>·</span>
                        <span>expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                  Awaiting sign-in
                </span>
                <button
                  onClick={() => confirmRevokeInvite(inv)}
                  title="Revoke invite"
                  className="flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      </>)}

      {/* Workspace Trash: deleted workspaces held before permanent purge. */}
      {activeTab === 'trash' && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Workspace Trash
            </h2>
            <span className="text-xs text-slate-400">purged permanently after {trash.retentionDays} days</span>
          </div>
          {trash.trashed.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
              The trash is empty. Deleted workspaces are held here for {trash.retentionDays} days before being purged.
            </div>
          ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
            {trash.trashed.map((w) => (
              <div key={w.id} className="flex items-center gap-4 px-6 py-3.5">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-slate-200"
                  style={{ background: `${w.theme}1a` }}
                >
                  <Trash2 size={16} style={{ color: w.theme }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">{w.name}</div>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                    <span>deleted {new Date(w.deletedAt).toLocaleDateString()}</span>
                    {w.deletedBy && (<><span>·</span><span>by {String(w.deletedBy).split('@')[0]}</span></>)}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  w.daysLeft <= 7 ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-slate-50 text-slate-600 ring-slate-200'
                }`}>
                  {w.daysLeft} {w.daysLeft === 1 ? 'day' : 'days'} left
                </span>
                <Button variant="outline" size="sm" disabled={!isOwner} title={isOwner ? undefined : 'Owner privileges required'} onClick={() => handleRestoreWorkspace(w)}>
                  <ArchiveRestore className="mr-1.5 h-3.5 w-3.5" /> Restore
                </Button>
                <Button variant="destructive" size="sm" disabled={!isOwner} title={isOwner ? undefined : 'Owner privileges required'} onClick={() => confirmPurgeWorkspace(w)}>
                  <Flame className="mr-1.5 h-3.5 w-3.5" /> Purge now
                </Button>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* AI spend across providers, attributed by agent and workspace. */}
      {activeTab === 'usage' && <UsageCost />}

      {/* Machine credentials for scripts/workbenches calling the API. */}
      {activeTab === 'apikeys' && <ApiKeysPanel workspaces={workspaces} />}

      {activeTab === 'integrations' && <IntegrationsPanel />}
    </div>
  );
}
