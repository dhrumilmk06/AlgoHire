export type SessionMode = 'normal' | 'system_design';

export interface Session {
  id: string;
  short_code: string;
  mode: SessionMode;
  host_name: string;
  problem_id?: string | number | null;
  created_at: string;
}

export interface SessionParticipant {
  name: string;
  joinedAt: number;
}
