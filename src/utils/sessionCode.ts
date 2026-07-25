/**
 * Generates a unique session code in CodeHire's ABC-XYZ format.
 * 6 uppercase alphanumeric characters split by a hyphen.
 */
export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const part = (len: number) =>
    Array(len)
      .fill(0)
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');

  return `${part(3)}-${part(3)}`;
}

/** Normalise user-typed code: trim, uppercase, allow optional hyphen */
export function normaliseCode(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length >= 6) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}`;
  return raw.trim().toUpperCase();
}
