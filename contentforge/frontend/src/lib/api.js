import { auth } from "./firebase";

export const API_BASE = import.meta.env.PROD ? "" : "http://localhost:3005";
let cachedOdinBase = null;

export async function getOdinBase() {
  if (cachedOdinBase) return cachedOdinBase;
  try {
    const res = await fetch(`${API_BASE}/api/config`);
    if (res.ok) {
      const config = await res.json();
      cachedOdinBase = config.ODIN_API_URL || "http://localhost:8000";
      return cachedOdinBase;
    }
  } catch (err) {
    console.error("Failed to load config", err);
  }
  return "http://localhost:8000";
}

/**
 * Returns the current user's Firebase ID token, or null if signed out.
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * fetch wrapper that attaches the Firebase ID token as a Bearer header.
 * Accepts an absolute URL or a path; pass the full URL you already use.
 */
export async function authFetch(url, options = {}) {
  const token = await getIdToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
