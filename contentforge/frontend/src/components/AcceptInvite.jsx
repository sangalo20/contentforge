import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { API_BASE } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithEmail } = useAuth();

  const [status, setStatus] = useState('checking'); // checking | valid | invalid
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [googleFailed, setGoogleFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/invites/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!active) return;
        if (data.valid) {
          setEmail(data.email || '');
          setStatus('valid');
        } else {
          setReason(data.reason || '');
          setStatus('invalid');
        }
      } catch {
        if (active) setStatus('invalid');
      }
    })();
    return () => { active = false; };
  }, [token]);

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      // The backend redeems the pending invite (role + access) on first login.
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      const code = err?.code || '';
      // Google blocks accounts outside the Workspace org ("Access blocked:
      // ... can only be used within its organization"). That block happens
      // inside Google's popup, so Firebase usually just reports the popup was
      // closed. Either way, steer personal-account users to the password path.
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/user-cancelled' ||
        code === 'auth/internal-error'
      ) {
        setError("If your Google account isn't part of this organization, it can't use Google sign-in. Set a password below to continue.");
      } else {
        setError(err.message || 'Google sign-in failed. You can set a password below instead.');
      }
      setGoogleFailed(true);
      setBusy(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setGoogleFailed(false);
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/invites/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
        setBusy(false);
        return;
      }
      // Account is ready — sign in and enter the app.
      await signInWithEmail(data.email, password);
      navigate('/', { replace: true });
    } catch {
      setError('Failed to accept invite');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        {status === 'checking' && (
          <>
            <CardHeader>
              <CardTitle>Checking your invite…</CardTitle>
              <CardDescription>One moment.</CardDescription>
            </CardHeader>
          </>
        )}

        {status === 'invalid' && (
          <>
            <CardHeader>
              <CardTitle>Invite not valid</CardTitle>
              <CardDescription>
                {reason === 'expired'
                  ? 'This invite has expired. Ask an admin to send a new one.'
                  : reason === 'used'
                  ? 'This invite has already been used. Try signing in instead.'
                  : 'This invite link is invalid. Ask an admin to send a new one.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                Go to sign in
              </Button>
            </CardContent>
          </>
        )}

        {status === 'valid' && (
          <>
            <CardHeader>
              <CardTitle>Accept your invite</CardTitle>
              <CardDescription>
                You've been invited to ContentForge as <span className="font-medium text-slate-700">{email}</span>.
                Continue with Google or set a password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </Button>

              {googleFailed && error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or set a password
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleSetPassword} className={`space-y-4 ${googleFailed ? 'rounded-xl ring-2 ring-blue-200 ring-offset-2 p-1' : ''}`}>
                <div className="space-y-1.5">
                  <Label htmlFor="ai-password">New password</Label>
                  <Input
                    id="ai-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ai-confirm">Confirm password</Label>
                  <Input
                    id="ai-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </div>
                {!googleFailed && error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? 'Setting up…' : 'Set password & continue'}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
