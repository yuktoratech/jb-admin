const ACCESS_TOKEN_STORAGE_KEY = "jb-admin.access-token";

const canUseLocalStorage = () => typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const token = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return clearAccessToken();
  }

  try {
    window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, normalizedToken);
    return true;
  } catch {
    return false;
  }
}

export function clearAccessToken(): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

