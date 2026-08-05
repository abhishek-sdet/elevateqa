// Speakers/agenda store extra fields (bio, linkedin / tag, desc) packed into
// a single `title` text column, since adding real columns would need a
// Supabase schema migration. They used to be joined with the literal string
// "||", which silently corrupts data if an admin types "||" in any of those
// fields (bio, title, linkedin, tag, or desc), since split('||') would then
// produce extra/misaligned parts. The ASCII Unit Separator (\u001F) is a
// control character no keyboard or paste can produce, so it can't collide
// with real typed content — new saves use it instead. Unpacking still falls
// back to the old "||" split so rows saved before this change keep working.
const SEP = '\u001F';
const LEGACY_SEP = '||';

export function packFields(...fields) {
  return fields.map(f => f ?? '').join(SEP);
}

export function unpackFields(raw, count) {
  if (raw === null || raw === undefined) return new Array(count).fill('');
  const parts = raw.includes(SEP) ? raw.split(SEP) : raw.split(LEGACY_SEP);
  return Array.from({ length: count }, (_, i) => parts[i] ?? '');
}
