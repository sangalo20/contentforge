import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { API_BASE, authFetch } from "../lib/api";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  // Per-workspace reviewer grants: 'all' | [workspace ids]. Orthogonal to the
  // admin/creator tier — admins are NOT implicitly reviewers.
  const [reviewerWorkspaces, setReviewerWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const res = await authFetch(`${API_BASE}/api/auth/me`);
          if (res.ok) {
            const data = await res.json();
            setRole(data.role || "creator");
            setReviewerWorkspaces(data.reviewerWorkspaces ?? []);
          } else {
            setRole("creator");
            setReviewerWorkspaces([]);
          }
        } catch {
          setRole("creator");
          setReviewerWorkspaces([]);
        }
      } else {
        setRole(null);
        setReviewerWorkspaces([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const signOut = () => firebaseSignOut(auth);

  // Tier: owner ⊃ admin ⊃ creator. Owners pass every admin check and can
  // additionally delete workspaces and manage the owner role.
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || isOwner;
  // Whether this user may review (approve / request changes) in a workspace.
  const canReview = (workspaceId) =>
    reviewerWorkspaces === "all" ||
    (Array.isArray(reviewerWorkspaces) && reviewerWorkspaces.includes(workspaceId));

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isOwner,
        canReview,
        reviewerWorkspaces,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
