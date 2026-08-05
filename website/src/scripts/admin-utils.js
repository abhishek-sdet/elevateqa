// Escape HTML special chars before interpolating untrusted (DB/user-submitted)
// text into innerHTML template strings. Attendee/speaker/agenda data comes
// from public-facing registration and speaker-application forms, so it must
// be treated as untrusted before it's rendered back into the admin UI.
export const escapeHtml = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// For values interpolated into an inline onclick="...('${value}')" attribute:
// escaping for HTML alone isn't enough, since the attribute's decoded content
// is then parsed as a JS string literal — a bare `'` or `\` in the value
// would still terminate/corrupt that string. Escape for the JS string first,
// then HTML-escape the result for the attribute itself.
export const jsAttrSafe = (value) => escapeHtml(String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"));

// Only allow http(s) links for user-submitted URLs (e.g. LinkedIn) — blocks
// `javascript:`/`data:` URIs stored in a free-text field from executing when
// an admin clicks the rendered link.
export const safeHttpUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(String(url), window.location.href);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
  } catch {
    return null;
  }
};
