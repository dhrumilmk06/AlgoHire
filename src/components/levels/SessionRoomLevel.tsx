import { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import '@excalidraw/excalidraw/index.css';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Terminal,
  FileCode2,
  Users,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

import { runCode } from '../../services/codeExecutor';
import { fetchProblemById } from '../../services/problemsService';
import type { Session } from '../../types/Session';
import type { SolveProblem } from '../../types/SolveProblem';

// ── Excalidraw lazy import ────────────────────────────────────────────────────
const ExcalidrawLazy = lazy(async () => {
  const { Excalidraw } = await import('@excalidraw/excalidraw');
  return { default: Excalidraw };
});

// ── Shared types ──────────────────────────────────────────────────────────────
type Language = 'javascript' | 'python' | 'java' | 'cpp';

const LANGUAGE_CONFIG: Record<Language, { label: string; monacoLang: string; icon: string }> = {
  javascript: { label: 'JavaScript', monacoLang: 'javascript', icon: 'JS' },
  python:     { label: 'Python',     monacoLang: 'python',     icon: 'PY' },
  java:       { label: 'Java',       monacoLang: 'java',       icon: 'JA' },
  cpp:        { label: 'C++',        monacoLang: 'cpp',        icon: 'C+' },
};

const DIFFICULTY_STYLE: Record<string, string> = {
  Easy:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Medium: 'text-amber-400   bg-amber-500/10   border-amber-500/30',
  Hard:   'text-red-400     bg-red-500/10     border-red-500/30',
};

const MONACO_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 13,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: 12 },
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
};

interface TestResult {
  index: number;
  input: string;
  expected: string;
  actual: string;
  stderr: string;
  status: string;
  executionTime: number;
  passed: boolean;
  running: boolean;
}

// ── Top bar (shared) ──────────────────────────────────────────────────────────
interface TopBarProps {
  session: Session;
  participantName: string;
  onlineCount: number;
  onLeave: () => void;
}

function TopBar({ session, participantName, onlineCount, onLeave }: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(session.short_code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="shrink-0 h-12 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex items-center px-4 gap-3">
      <button
        id="leave-session-btn"
        onClick={onLeave}
        className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors"
      >
        <ArrowLeft size={14} />
        Leave
      </button>

      <div className="w-px h-5 bg-white/10 mx-1" />

      {/* Code badge */}
      <button
        onClick={copy}
        className="flex items-center gap-2 px-3 py-1 bg-slate-800/60 border border-white/10 rounded-lg hover:border-cyan-500/30 transition group"
        title="Copy session code"
      >
        <span className="font-mono text-xs font-black text-cyan-300 tracking-[0.2em]">{session.short_code}</span>
        {copied
          ? <Check size={11} className="text-emerald-400" />
          : <Copy size={11} className="text-slate-600 group-hover:text-slate-400" />}
      </button>

      {/* Mode badge */}
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        session.mode === 'normal'
          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
          : 'text-violet-400 bg-violet-500/10 border-violet-500/30'
      }`}>
        {session.mode === 'normal' ? 'Normal' : 'System Design'}
      </span>

      <div className="ml-auto flex items-center gap-3">
        {/* Participant name */}
        <span className="text-xs text-slate-600 font-mono hidden sm:block">
          You: <span className="text-slate-400">{participantName}</span>
        </span>

        {/* Presence pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-white/10 rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${onlineCount > 1 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <Users size={11} className="text-slate-500" />
          <span className="text-[11px] font-bold text-slate-400">{onlineCount} online</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMAL ROOM VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface NormalRoomViewProps {
  session: Session;
  participantName: string;
  socket: Socket;
}

function NormalRoomView({ session, participantName, socket }: NormalRoomViewProps) {
  const [language, setLanguage]   = useState<Language>('javascript');
  const [results, setResults]     = useState<TestResult[]>([]);
  const [running, setRunning]     = useState(false);
  const [busyBanner, setBusyBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'results'>('description');
  const [problem, setProblem]     = useState<SolveProblem | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef   = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const codeRef     = useRef<string>('// Start coding here…\n');
  const lastReceivedCode = useRef<string | null>(null);
  const isApplyingRemote = useRef(false);

  // Load problem if session has one
  useEffect(() => {
    if (session.problem_id) {
      fetchProblemById(session.problem_id).then((p) => {
        if (p) {
          setProblem(p);
          const initialCode = p.starter_code?.javascript ?? '// Start coding here…\n';
          codeRef.current = initialCode;
          if (editorRef.current) {
            editorRef.current.setValue(initialCode);
          }
        }
      });
    }
  }, [session.problem_id]);

  // Subscribe to incoming broadcasts
  useEffect(() => {
    const handleCodeUpdate = (payload: any) => {
      if (payload.from === participantName) return;

      const remoteCode = payload.code ?? '';
      lastReceivedCode.current = remoteCode;
      codeRef.current = remoteCode;

      const editor = editorRef.current;
      if (editor && editor.getValue() !== remoteCode) {
        isApplyingRemote.current = true;
        const model = editor.getModel();
        if (model) {
          editor.executeEdits('remote', [{
            range: model.getFullModelRange(),
            text: remoteCode
          }]);
        } else {
          editor.setValue(remoteCode);
        }
        isApplyingRemote.current = false;
      }

      if (payload.language && payload.language !== language) {
        setLanguage(payload.language as Language);
      }
    };

    const handleRunResult = (payload: any) => {
      if (payload.from === participantName) return;
      setResults(payload.results);
      setActiveTab('results');
    };

    socket.on('code_update', handleCodeUpdate);
    socket.on('run_result', handleRunResult);

    return () => { 
      socket.off('code_update', handleCodeUpdate);
      socket.off('run_result', handleRunResult);
    };
  }, [socket, participantName, language]);

  // Broadcast code changes (debounced 300ms)
  const broadcastCode = useCallback((newCode: string, lang: Language) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      socket.emit('code_update', { code: newCode, language: lang, from: participantName });
    }, 300);
  }, [socket, participantName]);

  const handleCodeChange = (val: string | undefined) => {
    const newCode = val ?? '';
    if (isApplyingRemote.current || newCode === lastReceivedCode.current) {
      return;
    }
    codeRef.current = newCode;
    broadcastCode(newCode, language);
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const starter = problem?.starter_code?.[lang] ?? codeRef.current;
    codeRef.current = starter;
    if (editorRef.current) {
      editorRef.current.setValue(starter);
    }
    broadcastCode(starter, lang);
  };

  const handleRun = useCallback(async () => {
    if (running || !problem) return;
    setBusyBanner(false);
    setRunning(true);
    setActiveTab('results');

    const activeCode = editorRef.current?.getValue() ?? codeRef.current;

    const testCases = problem.test_cases ?? [];
    const initial: TestResult[] = testCases.map((tc, i) => ({
      index: i, input: tc.input, expected: tc.expected_output,
      actual: '', stderr: '', status: 'Queued', executionTime: 0, passed: false, running: true,
    }));
    setResults(initial);

    let anyBusy = false;
    const finalResults = [...initial];

    for (let i = 0; i < testCases.length; i++) {
      setResults((prev) => prev.map((r) => r.index === i ? { ...r, status: 'Running…' } : r));

      const result = await runCode({ language: LANGUAGE_CONFIG[language].label, code: activeCode, stdin: testCases[i].input });
      const isBusy = result.status === 'Timeout' || result.stderr?.includes('execution service is busy');
      if (isBusy) anyBusy = true;

      const actual   = result.stdout.trim();
      const expected = testCases[i].expected_output.trim();
      const passed   = result.status === 'Accepted' && actual === expected;

      const updated = { ...finalResults[i], running: false, actual: result.stdout, stderr: result.stderr, status: result.status, executionTime: result.executionTime, passed };
      finalResults[i] = updated;
      setResults((prev) => prev.map((r) => r.index === i ? updated : r));
    }

    if (anyBusy) setBusyBanner(true);
    setRunning(false);

    // Broadcast run results to all participants
    socket.emit('run_result', { results: finalResults, from: participantName });
  }, [running, problem, language, socket, participantName]);

  const passCount  = results.filter((r) => r.passed).length;
  const totalCount = problem?.test_cases?.length ?? 0;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left panel */}
      <div className="w-[38%] border-r border-white/5 flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="shrink-0 flex border-b border-white/5 bg-slate-900/40">
          {[
            { id: 'description', label: 'Description', icon: FileCode2 },
            { id: 'results', label: results.length > 0 && !running ? `Results ${passCount}/${totalCount}` : 'Results', icon: Terminal },
          ].map((tab) => (
            <button key={tab.id} id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as 'description' | 'results')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === tab.id ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              <tab.icon size={13} />{tab.label}
            </button>
          ))}
        </div>

        {/* Description */}
        {activeTab === 'description' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {!problem && (
              <div className="text-slate-600 text-sm font-mono text-center py-16">
                No problem linked to this session.<br/>
                <span className="text-xs mt-2 block">Use the editor freely or join a session with a problem.</span>
              </div>
            )}
            {problem && (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-600">#{problem.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${DIFFICULTY_STYLE[problem.difficulty]}`}>{problem.difficulty}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white leading-tight">{problem.title}</h2>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{problem.description}</p>
                {(problem.examples?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase">Examples</h3>
                    {(problem.examples ?? []).map((ex, i) => (
                      <div key={i} className="bg-slate-900 border border-white/5 rounded-lg p-3 font-mono text-xs space-y-1">
                        <div><span className="text-slate-600">Input: </span><span className="text-slate-300">{ex.input}</span></div>
                        <div><span className="text-slate-600">Output: </span><span className="text-slate-300">{ex.output}</span></div>
                      </div>
                    ))}
                  </div>
                )}
                {(problem.constraints?.length ?? 0) > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={11} className="text-amber-500" /> Constraints
                    </h3>
                    <ul className="space-y-1">
                      {(problem.constraints ?? []).map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-500 font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />{c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Results */}
        {activeTab === 'results' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {results.length === 0 && (
              <div className="text-center py-16 text-slate-600 text-sm font-mono">
                Click <span className="text-cyan-500 font-bold">Run</span> to test your code.
              </div>
            )}
            {results.length > 0 && !running && (
              <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${passCount === totalCount ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                {passCount === totalCount
                  ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  : <XCircle size={18} className="text-red-400 shrink-0" />}
                <span className={`text-sm font-bold ${passCount === totalCount ? 'text-emerald-300' : 'text-red-300'}`}>
                  {passCount === totalCount ? 'All Passed!' : `${passCount} / ${totalCount} Passed`}
                </span>
              </div>
            )}
            {results.map((r) => (
              <div key={r.index} id={`result-case-${r.index}`}
                className={`rounded-xl border overflow-hidden ${r.running ? 'border-cyan-500/20 bg-slate-900/60' : r.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
                  {r.running ? <Loader2 size={14} className="animate-spin text-cyan-400 shrink-0" />
                    : r.passed ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    : <XCircle size={14} className="text-red-400 shrink-0" />}
                  <span className="text-xs font-bold text-slate-300">Case {r.index + 1}</span>
                  {!r.running && (
                    <>
                      <span className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.passed ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                        {r.passed ? 'Pass' : 'Fail'}
                      </span>
                      {r.executionTime > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                          <Clock size={10} />{r.executionTime}ms
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!r.running && (
                  <div className="p-3 space-y-1.5 font-mono text-xs">
                    <div><span className="text-slate-600">Expected: </span><span className="text-emerald-400">{r.expected}</span></div>
                    <div><span className="text-slate-600">Got: </span><span className={r.passed ? 'text-emerald-400' : 'text-red-400'}>{r.actual || '(empty)'}</span></div>
                    {r.stderr && <pre className="mt-2 p-2 bg-red-950/30 border border-red-500/20 rounded text-red-400 text-[11px] whitespace-pre-wrap">{r.stderr}</pre>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Monaco editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Editor controls bar */}
        <div className="shrink-0 h-10 bg-slate-900/60 border-b border-white/5 flex items-center px-4 gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-0.5">
            {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => (
              <button key={lang} id={`lang-${lang}`}
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  language === lang ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {LANGUAGE_CONFIG[lang].icon}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {busyBanner && (
              <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
                <AlertCircle size={11} />Execution busy — try again
              </span>
            )}
            <button id="run-code-btn"
              onClick={handleRun}
              disabled={running || !problem}
              title={!problem ? 'No problem linked to this session' : undefined}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                running || !problem
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-md shadow-cyan-500/20 active:scale-95'
              }`}>
              {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-current" />}
              {running ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>

        {/* Monaco */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={LANGUAGE_CONFIG[language].monacoLang}
            defaultValue={codeRef.current}
            onChange={handleCodeChange}
            onMount={(editor) => { editorRef.current = editor; }}
            theme="vs-dark"
            options={MONACO_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM DESIGN ROOM VIEW
// ─────────────────────────────────────────────────────────────────────────────
interface SystemDesignRoomViewProps {
  participantName: string;
  socket: Socket;
}

function SystemDesignRoomView({ participantName, socket }: SystemDesignRoomViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawAPIRef   = useRef<any>(null);
  const debounceRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isApplyingRef      = useRef(false);

  // Subscribe to incoming draw updates
  useEffect(() => {
    const handleDrawUpdate = (payload: any) => {
      if (payload.from === participantName) return;
      if (!excalidrawAPIRef.current) return;
      isApplyingRef.current = true;
      excalidrawAPIRef.current.updateScene({ elements: payload.elements });
      isApplyingRef.current = false;
    };

    socket.on('draw_update', handleDrawUpdate);
    return () => { socket.off('draw_update', handleDrawUpdate); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantName, socket]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = useCallback((elements: readonly any[]) => {
    if (isApplyingRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      socket.emit('draw_update', { elements, from: participantName });
    }, 200);
  }, [socket, participantName]);

  return (
    <div className="flex-1 w-full h-full overflow-hidden">
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-500 h-full">
          <Loader2 size={20} className="animate-spin text-violet-400" />
          <span className="text-sm font-mono">Loading whiteboard…</span>
        </div>
      }>
        <ExcalidrawLazy
          excalidrawAPI={(api) => { excalidrawAPIRef.current = api; }}
          onChange={handleChange}
          theme="dark"
          UIOptions={{
            canvasActions: {
              export: false,
              loadScene: false,
            },
          }}
        />
      </Suspense>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION ROOM LEVEL (main export)
// ─────────────────────────────────────────────────────────────────────────────
interface SessionRoomLevelProps {
  session: Session;
  participantName: string;
  onLeave: () => void;
}

export function SessionRoomLevel({ session, participantName, onLeave }: SessionRoomLevelProps) {
  const [onlineCount, setOnlineCount] = useState(1);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { room: session.short_code, participantName });
    });

    socket.on('presence_update', (count: number) => {
      setOnlineCount(count);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [session.short_code, participantName]);

  if (!connected || !socketRef.current) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950" style={{ left: '80px' }}>
        <Loader2 size={24} className="animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-950 overflow-hidden" style={{ left: '80px' }}>
      <TopBar
        session={session}
        participantName={participantName}
        onlineCount={onlineCount}
        onLeave={onLeave}
      />

      {session.mode === 'normal' ? (
        <NormalRoomView
          session={session}
          participantName={participantName}
          socket={socketRef.current}
        />
      ) : (
        <SystemDesignRoomView
          participantName={participantName}
          socket={socketRef.current}
        />
      )}
    </div>
  );
}
