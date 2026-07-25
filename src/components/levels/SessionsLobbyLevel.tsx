import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  LogIn,
  Code2,
  PenTool,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { createSession, getSessionByCode } from '../../services/sessionService';
import { fetchProblems } from '../../services/problemsService';
import { normaliseCode } from '../../utils/sessionCode';
import type { Session, SessionMode } from '../../types/Session';
import type { SolveProblem } from '../../types/SolveProblem';

interface SessionsLobbyLevelProps {
  onSessionReady: (session: Session, participantName: string) => void;
}

export function SessionsLobbyLevel({ onSessionReady }: SessionsLobbyLevelProps) {
  // ── Create state ────────────────────────────────────────────────────────────
  const [mode, setMode]             = useState<SessionMode>('normal');
  const [hostName, setHostName]     = useState('');
  const [problemId, setProblemId]   = useState<string>('');
  const [problems, setProblems]     = useState<SolveProblem[]>([]);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [copied, setCopied]         = useState(false);

  // ── Join state ──────────────────────────────────────────────────────────────
  const [joinCode, setJoinCode]     = useState('');
  const [joinName, setJoinName]     = useState('');
  const [joining, setJoining]       = useState(false);
  const [joinError, setJoinError]   = useState('');

  useEffect(() => {
    if (mode === 'normal') {
      fetchProblems().then(setProblems).catch(() => {});
    }
  }, [mode]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!hostName.trim()) { setCreateError('Please enter a host name.'); return; }
    setCreateError('');
    setCreating(true);
    try {
      const session = await createSession({
        mode,
        host_name: hostName.trim(),
        problem_id: mode === 'normal' && problemId ? problemId : null,
      });
      setCreatedCode(session.short_code);
      // Auto-enter session after showing code
      setTimeout(() => onSessionReady(session, hostName.trim()), 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create session. Check Supabase table setup.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { setJoinError('Please enter a session code.'); return; }
    if (!joinName.trim()) { setJoinError('Please enter your display name.'); return; }
    setJoinError('');
    setJoining(true);
    try {
      const norm = normaliseCode(joinCode);
      const session = await getSessionByCode(norm);
      if (!session) {
        setJoinError(`No session found with code "${norm}". Check the code and try again.`);
        return;
      }
      onSessionReady(session, joinName.trim());
    } catch (err: any) {
      setJoinError(err.message || 'Failed to join session.');
    } finally {
      setJoining(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 bg-slate-950 flex flex-col overflow-hidden"
      style={{ left: '80px' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-8 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Users size={16} className="text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sessions</h1>
        </div>
        <p className="text-sm text-slate-500 font-mono ml-11">
          Real-time collaborative coding &amp; system design
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col lg:flex-row gap-6 items-start">

        {/* ── CREATE PANEL ── */}
        <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Plus size={14} className="text-cyan-400" />
            </div>
            <h2 className="text-base font-bold text-white">Create Session</h2>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mode</label>
            <div className="flex bg-slate-800/60 border border-white/10 rounded-xl p-1 gap-1">
              {([
                { value: 'normal',        label: 'Normal Coding',  Icon: Code2   },
                { value: 'system_design', label: 'System Design',  Icon: PenTool },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  id={`mode-${value}`}
                  onClick={() => { setMode(value); setCreateError(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    mode === value
                      ? value === 'normal'
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-sm border border-cyan-500/20'
                        : 'bg-violet-500/20 text-violet-300 shadow-sm border border-violet-500/20'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Host name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Name</label>
            <input
              id="host-name-input"
              type="text"
              placeholder="e.g. Alice"
              value={hostName}
              onChange={(e) => { setHostName(e.target.value); setCreateError(''); }}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition"
            />
          </div>

          {/* Problem picker (Normal only) */}
          {mode === 'normal' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Problem <span className="text-slate-700 font-normal">(optional)</span>
              </label>
              <select
                id="problem-picker"
                value={problemId}
                onChange={(e) => setProblemId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition appearance-none"
              >
                <option value="">— No specific problem —</option>
                {problems.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.id} {p.title} [{p.difficulty}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error */}
          {createError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {createError}
            </div>
          )}

          {/* Created code badge */}
          {createdCode && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4">
              <div>
                <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Session Code</div>
                <div className="text-2xl font-black font-mono text-emerald-300 tracking-[0.2em]">{createdCode}</div>
              </div>
              <button onClick={copyCode} className="ml-auto p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          )}

          {/* Create button */}
          {!createdCode && (
            <button
              id="create-session-btn"
              onClick={handleCreate}
              disabled={creating}
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all ${
                creating
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-md shadow-cyan-500/20 active:scale-[0.98]'
              }`}
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {creating ? 'Creating…' : 'Create Session'}
            </button>
          )}
          {createdCode && (
            <p className="text-center text-xs text-slate-600 font-mono">Entering room…</p>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:flex flex-col items-center gap-2 pt-16 px-2">
          <div className="w-px flex-1 bg-white/5" />
          <span className="text-xs text-slate-700 font-bold">OR</span>
          <div className="w-px flex-1 bg-white/5" />
        </div>
        <div className="flex lg:hidden items-center gap-4 w-full">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-xs text-slate-700 font-bold">OR</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* ── JOIN PANEL ── */}
        <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <LogIn size={14} className="text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-white">Join Session</h2>
          </div>

          {/* Code input */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Code</label>
            <input
              id="join-code-input"
              type="text"
              placeholder="ABC-XYZ"
              maxLength={7}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-lg font-black font-mono text-violet-300 tracking-[0.3em] placeholder-slate-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition text-center"
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Name</label>
            <input
              id="join-name-input"
              type="text"
              placeholder="e.g. Bob"
              value={joinName}
              onChange={(e) => { setJoinName(e.target.value); setJoinError(''); }}
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition"
            />
          </div>

          {/* Error */}
          {joinError && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {joinError}
            </div>
          )}

          {/* Join button */}
          <button
            id="join-session-btn"
            onClick={handleJoin}
            disabled={joining}
            className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-all mt-auto ${
              joining
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-violet-500 hover:bg-violet-400 text-white shadow-md shadow-violet-500/20 active:scale-[0.98]'
            }`}
          >
            {joining ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            {joining ? 'Joining…' : 'Join Session'}
          </button>

          <p className="text-center text-xs text-slate-700">
            Ask the host to share their session code
          </p>
        </div>
      </div>
    </div>
  );
}
