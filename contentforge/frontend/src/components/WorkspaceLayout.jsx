import { useState, useEffect, useRef } from 'react';
import { useParams, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { Play, BookOpen, Settings, LayoutGrid, Users, HelpCircle, Share2, Menu, X, Home, ChevronDown } from 'lucide-react';
import { FaLinkedin, FaXTwitter, FaInstagram, FaFacebook } from "react-icons/fa6";
import { authFetch, API_BASE } from '../lib/api';
import { useAuth } from '../context/useAuth';
import NotificationBell from './NotificationBell';

export default function WorkspaceLayout() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPrimaryNav, setShowPrimaryNav] = useState(false);
  const [showWsSwitcher, setShowWsSwitcher] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const switcherRef = useRef(null);

  useEffect(() => {
    authFetch(`${API_BASE}/api/workspaces`)
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setShowWsSwitcher(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = workspaces.find(w => w.id === id);

  // Stay in the same section when switching workspaces. Item-scoped paths
  // (e.g. /library/item/:itemId/...) don't transfer, so fall back to the section root.
  const getSwitchPath = (wsId) => {
    const [section, ...rest] = location.pathname.split('/').filter(Boolean).slice(2);
    if (!section) return `/workspace/${wsId}`;
    if (section === 'library') return `/workspace/${wsId}/library`;
    if (section === 'social' && rest[0]) return `/workspace/${wsId}/social/${rest[0]}`;
    return `/workspace/${wsId}/${section}`;
  };

  const matchSocialItem = location.pathname.match(/\/library\/item\/([^/]+)\/social/);
  const matchGlobalSocial = location.pathname.match(/\/workspace\/[^/]+\/social/);

  const isSocialMode = !!matchSocialItem || !!matchGlobalSocial;
  const socialItemId = matchSocialItem ? matchSocialItem[1] : null;

  // Leaving social mode closes the primary-nav flyout. Adjust during render
  // (React's "derived state reset" pattern) instead of in an effect.
  const [wasSocialMode, setWasSocialMode] = useState(isSocialMode);
  if (wasSocialMode !== isSocialMode) {
    setWasSocialMode(isSocialMode);
    if (!isSocialMode) setShowPrimaryNav(false);
  }

  if (loading) return <div className="p-10 text-sm text-slate-500">Loading workspace...</div>;
  if (!config) return <div className="p-10 text-sm text-slate-500">Workspace not found</div>;

  // Determine active tab based on URL. The workspace index is the Overview
  // dashboard; the generator lives at /pipeline.
  const path = location.pathname;
  let activeTab = /^\/workspace\/[^/]+\/?$/.test(path) ? 'overview' : 'pipeline';
  if (path.includes('/library') && !isSocialMode) activeTab = 'library';
  if (path.includes('/settings')) activeTab = 'settings';
  if (path.includes('/social') && !isSocialMode) activeTab = 'social'; // fallback if needed

  if (isSocialMode) {
    const channelMatch = location.pathname.match(/\/social\/([^/]+)/);
    activeTab = channelMatch ? channelMatch[1] : 'linkedin';
    if (path.includes('/social-library')) activeTab = 'social-library';
  }


  const tabClass = (tab) => {
    const isActive = activeTab === tab;
    return `group flex items-center gap-3 rounded-full py-2.5 text-sm transition-colors ${
      isCollapsed ? 'px-0 justify-center w-12 mx-auto' : 'px-4'
    } ${
      isActive
        ? 'bg-white text-blue-600 font-bold shadow-sm'
        : 'text-white hover:bg-white hover:text-blue-600 font-medium'
    }`;
  };

  const getPageTitle = () => {
    if (isSocialMode) {
      if (activeTab === 'social-library') return 'Social Library';
      if (activeTab === 'x') return 'X (Twitter) Syndication';
      if (['linkedin', 'instagram', 'facebook'].includes(activeTab)) {
        return `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Syndication`;
      }
      return 'Social Syndication';
    }
    if (activeTab === 'overview') return 'Overview';
    if (activeTab === 'pipeline') return 'The Forge';
    if (activeTab === 'library') return 'Library';
    if (activeTab === 'settings') return 'Config & Persona';
    return '';
  };

  const getPageDescription = () => {
    if (isSocialMode) return 'Distribute your content across various social channels.';
    if (activeTab === 'overview') return 'The state of this workspace at a glance.';
    if (activeTab === 'pipeline') return 'Manage and orchestrate your content generation workflows.';
    if (activeTab === 'library') return 'Review, edit, and publish your generated drafts.';
    if (activeTab === 'settings') return 'Configure your AI persona and workspace preferences.';
    return '';
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Primary Sidebar Flyout (Overlay) */}
      {showPrimaryNav && isSocialMode && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 z-40 transition-opacity" onClick={() => setShowPrimaryNav(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-blue-600 border-r border-blue-500 z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-5 flex flex-col h-full">
              <div className="mb-8 flex items-center gap-3 select-none">
                <div 
                  className="p-1.5 rounded-md hover:bg-white cursor-pointer text-white hover:text-blue-600 transition-colors shrink-0"
                  onClick={() => setShowPrimaryNav(false)}
                >
                  <X size={20} />
                </div>
                <h1 className="text-[1.15rem] font-medium text-white tracking-tight">
                  ContentForge
                </h1>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-2">
                <Link to={`/workspace/${id}`} className={tabClass('overview')} onClick={() => setShowPrimaryNav(false)}>
                  <Home className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  <span className="truncate">Overview</span>
                </Link>
                <Link data-tour="tab-forge" to={`/workspace/${id}/pipeline`} className={tabClass('pipeline')} onClick={() => setShowPrimaryNav(false)}>
                  <Play className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'pipeline' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  <span className="truncate">The Forge</span>
                </Link>
                <Link data-tour="tab-library" to={`/workspace/${id}/library`} className={tabClass('library')} onClick={() => setShowPrimaryNav(false)}>
                  <BookOpen className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'library' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  <span className="truncate">Library</span>
                </Link>
                <Link data-tour="tab-social" to={`/workspace/${id}/social`} className={tabClass('social')} onClick={() => setShowPrimaryNav(false)}>
                  <Share2 className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'social' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  <span className="truncate">Social Media</span>
                </Link>
                {isAdmin && (
                  <Link data-tour="tab-settings" to={`/workspace/${id}/settings`} className={tabClass('settings')} onClick={() => setShowPrimaryNav(false)}>
                    <Settings className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                    <span className="truncate">Config & Persona</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar Navigation */}
      <div className={`shrink-0 border-r border-blue-500 bg-blue-600 flex flex-col h-full transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-56'}`}>
        <div className={`flex flex-col flex-1 overflow-y-auto ${isCollapsed ? 'p-4' : 'p-5'}`}>
          
          {/* Workspace Branding */}
          <div className={`mb-8 flex items-center transition-all select-none ${isCollapsed ? 'flex-col justify-center gap-4' : 'justify-start gap-3'}`}>
            <div 
              className="p-1.5 rounded-md hover:bg-white cursor-pointer text-white hover:text-blue-600 transition-colors shrink-0"
              onClick={() => {
                if (isSocialMode) {
                  setShowPrimaryNav(!showPrimaryNav);
                } else {
                  setIsCollapsed(!isCollapsed);
                }
              }}
              title={isSocialMode ? "Toggle Primary Menu" : (isCollapsed ? "Expand Sidebar" : "Collapse Sidebar")}
            >
              <Menu size={20} />
            </div>
            
            {!isCollapsed && (
              <h1 className="text-[1.15rem] font-medium text-white tracking-tight">
                ContentForge
              </h1>
            )}
          </div>

          {/* Links */}
          <div className="flex flex-col gap-1.5 mt-2">
            {isSocialMode ? (
              <>
                {!isCollapsed && <div className="text-xs font-bold uppercase tracking-wider text-blue-300 px-4 mt-2 mb-2">Social Media</div>}
                
                <Link to={socialItemId ? `/workspace/${id}/library/item/${socialItemId}/social/linkedin` : `/workspace/${id}/social/linkedin`} className={tabClass('linkedin')} title={isCollapsed ? "LinkedIn" : undefined}>
                  <FaLinkedin className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'linkedin' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">LinkedIn</span>}
                </Link>
                <Link to={socialItemId ? `/workspace/${id}/library/item/${socialItemId}/social/x` : `/workspace/${id}/social/x`} className={tabClass('x')} title={isCollapsed ? "X (Twitter)" : undefined}>
                  <FaXTwitter className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'x' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">X (Twitter)</span>}
                </Link>
                <Link to={socialItemId ? `/workspace/${id}/library/item/${socialItemId}/social/instagram` : `/workspace/${id}/social/instagram`} className={tabClass('instagram')} title={isCollapsed ? "Instagram" : undefined}>
                  <FaInstagram className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'instagram' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Instagram</span>}
                </Link>
                <Link to={socialItemId ? `/workspace/${id}/library/item/${socialItemId}/social/facebook` : `/workspace/${id}/social/facebook`} className={tabClass('facebook')} title={isCollapsed ? "Facebook" : undefined}>
                  <FaFacebook className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'facebook' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Facebook</span>}
                </Link>
                {!isCollapsed && <div className="text-xs font-bold uppercase tracking-wider text-blue-300 px-4 mt-4 mb-2">Content</div>}
                <Link to={`/workspace/${id}/social-library`} className={tabClass('social-library')} title={isCollapsed ? "Social Library" : undefined}>
                  <LayoutGrid className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'social-library' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Social Library</span>}
                </Link>
              </>
            ) : (
              <>
                <Link to={`/workspace/${id}`} className={tabClass('overview')} title={isCollapsed ? "Overview" : undefined}>
                  <Home className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'overview' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Overview</span>}
                </Link>
                <Link data-tour="tab-forge" to={`/workspace/${id}/pipeline`} className={tabClass('pipeline')} title={isCollapsed ? "The Forge" : undefined}>
                  <Play className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'pipeline' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">The Forge</span>}
                </Link>
                <Link data-tour="tab-library" to={`/workspace/${id}/library`} className={tabClass('library')} title={isCollapsed ? "Library" : undefined}>
                  <BookOpen className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'library' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Library</span>}
                </Link>
                <Link data-tour="tab-social" to={`/workspace/${id}/social`} className={tabClass('social')} title={isCollapsed ? "Social Media" : undefined}>
                  <Share2 className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'social' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                  {!isCollapsed && <span className="truncate">Social Media</span>}
                </Link>
                {isAdmin && (
                  <Link data-tour="tab-settings" to={`/workspace/${id}/settings`} className={tabClass('settings')} title={isCollapsed ? "Config & Persona" : undefined}>
                    <Settings className={`h-5 w-5 shrink-0 transition-colors ${activeTab === 'settings' ? 'text-blue-600' : 'text-white group-hover:text-blue-600'}`} />
                    {!isCollapsed && <span className="truncate">Config & Persona</span>}
                  </Link>
                )}
              </>
            )}
          </div>

        </div>

        {isAdmin && (
          <div className={`shrink-0 border-t border-blue-500 h-[65px] flex items-center bg-blue-600 ${isCollapsed ? 'justify-center px-4' : 'px-5'}`}>
            <Link
              to="/settings"
              className={`group flex w-full items-center gap-3 rounded-full py-2.5 text-sm font-medium text-white transition-colors hover:bg-white hover:text-blue-600 ${isCollapsed ? 'px-0 justify-center w-12 mx-auto' : 'px-4'}`}
              title={isCollapsed ? 'Admin' : undefined}
            >
              <Users className="h-5 w-5 shrink-0 text-white group-hover:text-blue-600" />
              {!isCollapsed && <span className="truncate">Admin</span>}
            </Link>
          </div>
        )}
      </div>

      {/* Child Content */}
      <div className="relative flex-1 flex flex-col min-w-0 bg-slate-50 h-screen overflow-hidden">
        <div 
          className={`flex-1 px-6 pb-8 flex flex-col ${activeTab === 'settings' ? 'overflow-hidden' : 'overflow-y-auto'}`}
          onScroll={(e) => setIsScrolled(e.target.scrollTop > 10)}
        >
          
          <div className={`sticky top-0 z-20 flex items-start justify-between mb-4 pt-8 pb-4 bg-blue-50/80 backdrop-blur-md -mx-6 px-6 transition-all duration-200 border-b ${
            (activeTab === 'library' && !isScrolled) ? 'border-transparent shadow-none' : 'border-slate-200/50 shadow-sm'
          }`}>
            <div>
              <h1 className="text-2xl text-slate-800 mb-1 flex items-center">
                <span className="relative" ref={switcherRef}>
                  <button
                    onClick={() => setShowWsSwitcher(!showWsSwitcher)}
                    title="Switch workspace"
                    className="flex items-center gap-2 rounded-lg -ml-2 px-2 py-0.5 font-semibold text-slate-700 transition-colors hover:bg-slate-200/60"
                  >
                    {config.theme && (
                      <span className="size-3 rounded-full shrink-0" style={{ background: config.theme }} />
                    )}
                    {config.name}
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform ${showWsSwitcher ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {showWsSwitcher && (
                    <div className="absolute left-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Switch Workspace
                      </div>
                      {workspaces.map(ws => {
                        const active = ws.id === id;
                        return (
                          <button
                            key={ws.id}
                            onClick={() => {
                              setShowWsSwitcher(false);
                              if (!active) navigate(getSwitchPath(ws.id));
                            }}
                            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                              active
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <span className="size-2 rounded-full shrink-0" style={{ background: ws.theme }} />
                            <span className="truncate">{ws.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </span>
                <span className="text-slate-300 font-light px-1">|</span> <span className="text-slate-500 font-normal">{getPageTitle()}</span>
              </h1>
              <p className="text-slate-500">{getPageDescription()}</p>
            </div>
            
            <div className="flex items-center gap-5 mr-2 mt-2">
              <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 underline underline-offset-4 decoration-slate-300 hover:decoration-blue-600 transition-colors">
                <LayoutGrid className="h-4 w-4" /> Dashboard
              </Link>
              <button
                onClick={() => window.dispatchEvent(new Event('open-onboarding'))}
                title="Getting started tour"
                className="flex items-center justify-center rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
              <NotificationBell />
            </div>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
