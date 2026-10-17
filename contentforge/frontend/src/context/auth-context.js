// The raw auth context object, in its own file so AuthContext.jsx exports only
// components and useAuth.js only the hook (react-refresh/only-export-components).
import { createContext } from 'react';

export const AuthContext = createContext({
  user: null,
  role: null,
  isAdmin: false,
  isOwner: false,
  canReview: () => false,
  reviewerWorkspaces: [],
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signOut: async () => {},
});
