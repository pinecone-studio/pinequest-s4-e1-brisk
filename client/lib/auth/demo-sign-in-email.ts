export const DEMO_SIGN_IN_EMAIL_COOKIE = "brisk_demo_email";
export const DEMO_SIGN_IN_EMAIL_STORAGE_KEY = "brisk_demo_email";

const FALLBACK_DEMO_SIGN_IN_EMAIL = "danny.otgontsetseg@gmail.com";

export function getConfiguredDemoSignInEmail() {
  return (
    process.env.NEXT_PUBLIC_DEMO_SIGN_IN_EMAIL?.trim().toLowerCase() ||
    FALLBACK_DEMO_SIGN_IN_EMAIL
  );
}

export function resolveDemoSignInEmail(storedEmail?: string | null) {
  return getConfiguredDemoSignInEmail() || storedEmail?.trim().toLowerCase() || "";
}

export function persistDemoSignInEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || typeof window === "undefined") return;

  window.localStorage.setItem(DEMO_SIGN_IN_EMAIL_STORAGE_KEY, normalized);
  document.cookie = `${DEMO_SIGN_IN_EMAIL_COOKIE}=${encodeURIComponent(normalized)}; path=/; max-age=31536000; SameSite=Lax`;
}

export function readStoredDemoSignInEmail() {
  if (typeof window === "undefined") return getConfiguredDemoSignInEmail();

  const stored = window.localStorage.getItem(DEMO_SIGN_IN_EMAIL_STORAGE_KEY);
  return resolveDemoSignInEmail(stored);
}
