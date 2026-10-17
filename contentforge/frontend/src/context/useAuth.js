// The auth hook lives apart from AuthProvider so AuthContext.jsx exports only
// components (react-refresh/only-export-components — keeps Fast Refresh exact).
import { useContext } from 'react';
import { AuthContext } from './auth-context';

export function useAuth() {
  return useContext(AuthContext);
}
