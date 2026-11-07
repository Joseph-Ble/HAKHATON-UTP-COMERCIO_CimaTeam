// Tokens are opaque: only Supabase validates them. Never log or persist a link.
export function parseAuthLink(raw, expectedOrigin = null) {
  if (typeof raw !== "string" || raw.length > 16384) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (["http:", "https:"].includes(url.protocol)) {
    if (!expectedOrigin || url.origin !== expectedOrigin) return null;
  } else if (!["entrevecinos:", "exp:", "exps:"].includes(url.protocol))
    return null;
  const path = (
    url.protocol === "entrevecinos:" && url.hostname
      ? `/${url.hostname}${url.pathname}`
      : url.pathname
  )
    .replace(/^\/--\//, "/")
    .replace(/\/$/, "");
  if (!["/recuperar", "/cuenta"].includes(path)) return null;
  const params = new URLSearchParams(url.search);
  const hash = new URLSearchParams(url.hash.slice(1));
  const value = (key) => params.get(key) || hash.get(key);
  if (value("error") || value("error_description"))
    return {
      error: "Este enlace no es válido o ya venció. Solicita uno nuevo.",
    };
  if (value("code")) return { code: value("code"), path };
  if (value("access_token") && value("refresh_token"))
    return {
      accessToken: value("access_token"),
      refreshToken: value("refresh_token"),
      path,
    };
  return null;
}
