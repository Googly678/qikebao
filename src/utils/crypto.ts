// Client-side helper: canonical query string generator (used for client-only tasks)
export function canonicalQuery(params: Record<string, string | number>) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${encodeURIComponent(String(params[k]))}`)
    .join('&')
}

// NOTE: encryption and signing are now performed on the server for security. Keep client-side crypto out of the browser.
