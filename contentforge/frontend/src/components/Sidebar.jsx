import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, Home, ChevronDown, Play, BookOpen } from 'lucide-react';
import { authFetch, API_BASE } from '../lib/api';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const path = location.pathname;
  let activeTab = 'pipeline';
  if (path.includes('/library')) activeTab = 'library';
  if (path.includes('/settings')) activeTab = 'settings';

  return (
    <div style={{ 
      width: '280px', 
      height: '100vh', 
      background: 'var(--bg-panel)', 
      backdropFilter: 'blur(10px)', 
      borderRight: '1px solid var(--border-glass)', 
      display: 'flex', 
      flexDirection: 'column', 
      padding: '24px',
      position: 'sticky',
      top: 0
    }}>
      
      {/* Top Section: Logo & Workspace Switcher */}
      <div style={{ marginBottom: '40px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isWorkspace ? '24px' : '0' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>CP</div>
          <h2 style={{ fontSize: '18px', margin: 0 }}>Content Pipeline</h2>
        </Link>

        {isWorkspace && currentWorkspace && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Current Workspace</div>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: '10px 12px', borderRadius: '8px', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: currentWorkspace.theme, boxShadow: `0 0 10px ${currentWorkspace.theme}` }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{currentWorkspace.name}</span>
              </div>
              <ChevronDown size={16} color="var(--text-secondary)" style={{ transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            
            {showDropdown && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'var(--bg-panel)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(`/workspace/${ws.id}/pipeline`);
                    }}
                    style={{ width: '100%', textAlign: 'left', background: ws.id === currentWorkspaceId ? 'rgba(255,255,255,0.5)' : 'transparent', border: 'none', padding: '10px 12px', borderRadius: '8px', color: ws.id === currentWorkspaceId ? 'var(--text-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', transition: 'all 0.2s' }}
                    onMouseEnter={e => {
                      if (ws.id !== currentWorkspaceId) e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={e => {
                      if (ws.id !== currentWorkspaceId) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ws.theme }} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Section: Workspace Navigation */}
      {isWorkspace && currentWorkspace && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: '600' }}>Menu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link 
              to={`/workspace/${currentWorkspaceId}/pipeline`}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
                background: activeTab === 'pipeline' ? 'rgba(255,255,255,0.6)' : 'transparent',
                color: activeTab === 'pipeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'pipeline' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                border: activeTab === 'pipeline' ? '1px solid var(--border-glass)' : '1px solid transparent'
              }}
              onMouseEnter={e => { if (activeTab !== 'pipeline') e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { if (activeTab !== 'pipeline') e.currentTarget.style.background = 'transparent' }}
            >
              <Play size={16} /> Generator
            </Link>
            <Link 
              to={`/workspace/${currentWorkspaceId}/library`}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
                background: activeTab === 'library' ? 'rgba(255,255,255,0.6)' : 'transparent',
                color: activeTab === 'library' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'library' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                border: activeTab === 'library' ? '1px solid var(--border-glass)' : '1px solid transparent'
              }}
              onMouseEnter={e => { if (activeTab !== 'library') e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { if (activeTab !== 'library') e.currentTarget.style.background = 'transparent' }}
            >
              <BookOpen size={16} /> Library
            </Link>
            <Link 
              to={`/workspace/${currentWorkspaceId}/settings`}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
                background: activeTab === 'settings' ? 'rgba(255,255,255,0.6)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'settings' ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                border: activeTab === 'settings' ? '1px solid var(--border-glass)' : '1px solid transparent'
              }}
              onMouseEnter={e => { if (activeTab !== 'settings') e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
              onMouseLeave={e => { if (activeTab !== 'settings') e.currentTarget.style.background = 'transparent' }}
            >
              <Settings size={16} /> Config
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Section: Global Nav */}
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link 
          to="/" 
          style={{ 
            color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
            padding: '10px 12px', borderRadius: '8px'
          }} 
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }} 
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Home size={16} /> Dashboard
        </Link>
        <Link 
          to="/settings" 
          style={{ 
            color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s',
            padding: '10px 12px', borderRadius: '8px'
          }} 
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }} 
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Settings size={16} /> Settings
        </Link>
      </div>
    </div>
  );
}
