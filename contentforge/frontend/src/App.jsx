import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import WorkspacesDashboard from './components/WorkspacesDashboard';
import PipelineTrigger from './components/PipelineTrigger';
import WorkspaceEditor from './components/WorkspaceEditor';
import WorkspaceLibrary from './components/WorkspaceLibrary';
import SocialLibrary from './components/SocialLibrary';
import WorkspaceLayout from './components/WorkspaceLayout';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import LibraryItemViewer from './components/LibraryItemViewer';
import GlobalHeader from './components/GlobalHeader';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import UserManagement from './components/UserManagement';
import AcceptInvite from './components/AcceptInvite';
import SocialMediaSyndication from './pages/SocialMediaSyndication';
import { AuthProvider } from './context/AuthContext';
import WhatsNewModal from './components/WhatsNewModal';
import OnboardingModal from './components/OnboardingModal';
import CoachTour from './components/CoachTour';
import './index.css';

import { useLocation } from 'react-router-dom';

// The Brand Studio carries its templates, fonts, and export machinery — lazy
// loaded so the main bundle stays lean.
const BrandStudio = lazy(() => import('./brand-studio/BrandStudio'));
const BrandKitSheet = lazy(() => import('./brand-studio/BrandKitSheet'));

function AppLayout() {
  const location = useLocation();
  const match = location.pathname.match(/^\/workspace\/([a-zA-Z0-9_-]+)/);
  const isWorkspaceRoute = match && match[1] !== 'new';
  // Full-bleed surfaces own the viewport: no global header, no page gutters.
  // Only the studio itself pins the shell (its sidebar is the only scroll);
  // the Brand Kit line sheet scrolls like a normal page.
  const isStudioRoute = location.pathname === '/brand-studio';
  const isFullBleed = isWorkspaceRoute || location.pathname.startsWith('/brand-studio');

  return (
    // The studio pins the shell to the viewport (only its sidebar scrolls);
    // every other page keeps normal document flow.
    <div className={`bg-slate-50 text-slate-900 flex flex-col ${isStudioRoute ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      <Toaster position="bottom-right" />
      <WhatsNewModal />
      <OnboardingModal />
      <CoachTour />
      {!isFullBleed && <GlobalHeader />}

      <main className={!isFullBleed ? "mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 flex-1" : "flex-1 flex flex-col min-h-0"}>
        <Routes>
          <Route path="/" element={<WorkspacesDashboard />} />
          <Route path="/workspace/new" element={<WorkspaceEditor />} />

          <Route path="/workspace/:id" element={<WorkspaceLayout />}>
            <Route index element={<WorkspaceDashboard />} />
            <Route path="pipeline" element={<PipelineTrigger />} />
            <Route path="library" element={<WorkspaceLibrary />} />
            <Route path="social-library" element={<SocialLibrary />} />
            <Route path="library/item/:itemId" element={<LibraryItemViewer />} />
            <Route path="library/item/:itemId/social/:channel?" element={<SocialMediaSyndication />} />
            <Route path="social/:channel?" element={<SocialMediaSyndication />} />
            <Route path="settings" element={<WorkspaceEditor />} />
          </Route>

          <Route path="/brand-studio" element={
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-400">Loading Brand Studio…</div>}>
              <BrandStudio />
            </Suspense>
          } />
          <Route path="/brand-studio/kit" element={
            <Suspense fallback={<div className="flex-1 flex items-center justify-center text-sm text-slate-400">Loading Brand Kit…</div>}>
              <BrandKitSheet />
            </Suspense>
          } />
          <Route path="/settings" element={<UserManagement />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
