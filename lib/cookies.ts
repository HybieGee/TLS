// Cookie utilities with secure defaults

export function setSecureCookie(name: string, value: string, maxAge: number = 30 * 24 * 60 * 60): string {
  const cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return cookie;
}

export function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue || null;
    }
  }
  return null;
}

export function clearCookie(name: string): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}