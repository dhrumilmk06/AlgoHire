import { supabase } from '../auth/supabaseClient';
import type { Session } from '../types/Session';
import type { SessionMode } from '../types/Session';
import { generateSessionCode } from '../utils/sessionCode';

interface CreateSessionPayload {
  mode: SessionMode;
  host_name: string;
  problem_id?: string | number | null;
}

/**
 * Safely format problem_id to a valid UUID string if it's a number/numeric string,
 * so Postgres UUID columns in Supabase don't throw syntax error.
 */
export function formatProblemIdForDb(id: string | number | null | undefined): string | null {
  if (id === null || id === undefined || id === '') return null;
  const strId = String(id).trim();
  if (!strId) return null;

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(strId)) return strId;

  const num = parseInt(strId, 10);
  if (!isNaN(num)) {
    const hex = Math.abs(num).toString(16).padStart(12, '0');
    return `00000000-0000-0000-0000-${hex}`;
  }

  return strId;
}

export function parseProblemIdFromDb(id: string | number | null | undefined): string | number | null {
  if (!id) return null;
  const str = String(id);
  if (str.startsWith('00000000-0000-0000-0000-')) {
    const hex = str.replace('00000000-0000-0000-0000-', '');
    const num = parseInt(hex, 16);
    if (!isNaN(num)) return num;
  }
  return id;
}

/**
 * Inserts a new session row and returns it.
 * Retries code generation on collision (same logic as CodeHire backend).
 */
export async function createSession(payload: CreateSessionPayload): Promise<Session> {
  const MAX_RETRIES = 5;
  const formattedProblemId = formatProblemIdForDb(payload.problem_id);

  for (let i = 0; i < MAX_RETRIES; i++) {
    const short_code = generateSessionCode();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        short_code,
        mode: payload.mode,
        host_name: payload.host_name,
        problem_id: formattedProblemId,
      })
      .select()
      .single();

    // Unique constraint violation → try another code
    if (error && error.code === '23505') continue;

    if (error) throw new Error(error.message);
    return data as Session;
  }

  throw new Error('Failed to generate a unique session code after multiple attempts.');
}

/**
 * Fetches a session by its short code (case-insensitive).
 */
export async function getSessionByCode(code: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .ilike('short_code', code.trim())
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Session | null;
}
