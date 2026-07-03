// Case + accent insensitive name matching for itsme ↔ KBO functions.
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function nameTokens(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

/**
 * Match if at least one first-name token AND the last name match between the
 * itsme identity and a KBO function entry. Handles multiple first names and
 * accent differences.
 */
export function matchIdentity(
  itsmeName: string,
  fn: { firstName: string; lastName: string },
): boolean {
  const itsmeTokens = nameTokens(itsmeName);
  const kboLastTokens = nameTokens(fn.lastName);
  const kboFirstTokens = nameTokens(fn.firstName);
  if (itsmeTokens.length < 2 || kboLastTokens.length === 0) return false;

  // Allow multi-token last names (e.g. "van Sprundel", "de Vries", "van der Berg").
  // The KBO last name must appear as a suffix of the itsme tokens.
  if (kboLastTokens.length >= itsmeTokens.length) return false;
  const suffixStart = itsmeTokens.length - kboLastTokens.length;
  for (let i = 0; i < kboLastTokens.length; i++) {
    if (itsmeTokens[suffixStart + i] !== kboLastTokens[i]) return false;
  }

  const itsmeFirsts = itsmeTokens.slice(0, suffixStart);
  if (itsmeFirsts.length === 0 || kboFirstTokens.length === 0) return false;
  return itsmeFirsts.some((f) => kboFirstTokens.includes(f));
}
