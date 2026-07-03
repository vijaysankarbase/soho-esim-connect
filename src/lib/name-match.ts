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
  if (itsmeTokens.length < 2) return false;
  const itsmeLast = itsmeTokens[itsmeTokens.length - 1];
  const itsmeFirsts = itsmeTokens.slice(0, -1);
  const kboFirsts = nameTokens(fn.firstName);
  const kboLast = normalize(fn.lastName);
  if (itsmeLast !== kboLast) return false;
  return itsmeFirsts.some((f) => kboFirsts.includes(f));
}
