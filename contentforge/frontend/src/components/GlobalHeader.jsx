import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ChevronDown, Plus, LogOut, Users, HelpCircle, Palette } from 'lucide-react';
import { Button } from './ui/button';
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';
import NotificationBell from './NotificationBell';

export default function GlobalHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch workspaces
  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => res.json())
      .then(data => setWorkspaces(data))
      .catch(err => console.error(err));
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const match = location.pathname.match(/^\/workspace\/([a-zA-Z0-9_-]+)/);
  const currentWorkspaceId = match ? match[1] : null;
  const isWorkspace = currentWorkspaceId && currentWorkspaceId !== 'new' && currentWorkspaceId !== 'edit';
  const currentWorkspace = isWorkspace ? workspaces.find(w => w.id === currentWorkspaceId) : null;

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              CF
            </div>
            <h2 className={`m-0 text-lg font-semibold text-slate-900 ${isWorkspace ? 'hidden' : 'block'}`}>
              Workspaces
            </h2>
          </Link>

          {isWorkspace && currentWorkspace && (
            <div className="flex items-center gap-3" ref={dropdownRef}>
              <span className="text-xl font-light text-slate-300">/</span>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-base font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: currentWorkspace.theme }}
                  />
                  {currentWorkspace.name}
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Switch Workspace
                    </div>
                    {workspaces.map(ws => {
                      const active = ws.id === currentWorkspaceId;
                      return (
                        <button
                          key={ws.id}
                          onClick={() => {
                            setShowDropdown(false);
                            navigate(`/workspace/${ws.id}/pipeline`);
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                            active
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ background: ws.theme }}
                          />
                          {ws.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-colors ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Home size={16} /> Dashboard
          </Link>
          <Link
            to="/brand-studio"
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-colors ${
              isActive('/brand-studio')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Palette size={16} /> Brand Studio
          </Link>
          {/* Everyone gets Settings (personal integrations live there);
              admins additionally see the team/trash/usage tabs inside. */}
          <Link
            to="/settings"
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-colors ${
              isActive('/settings')
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users size={16} /> {isAdmin ? 'Admin' : 'Settings'}
          </Link>

          {location.pathname === '/' && isAdmin && (
            <div data-tour="new-workspace" className="ml-2 pl-4 border-l border-slate-200">
               <Button onClick={() => navigate('/workspace/new')} size="sm">
                 <Plus size={16} className="mr-1.5" /> New Workspace
               </Button>
            </div>
          )}

          <div className="ml-2 flex items-center gap-2 pl-4 border-l border-slate-200">
            <button
              data-tour="help"
              onClick={() => window.dispatchEvent(new Event('open-onboarding'))}
              title="Getting started tour"
              className="flex items-center justify-center rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <HelpCircle size={18} />
            </button>
            <span data-tour="bell" className="flex">
              <NotificationBell />
            </span>
            {user && (
              <span className="hidden sm:inline text-xs text-slate-500 max-w-[160px] truncate" title={user.email}>
                {user.email}
              </span>
            )}
            <button
              onClick={() => signOut()}
              title="Sign out"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut size={16} />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
