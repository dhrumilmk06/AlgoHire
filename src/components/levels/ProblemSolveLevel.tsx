import { useState, useCallback, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  AlertCircle,
  Clock,
  Terminal,
  FileCode2,
  AlertTriangle,
} from 'lucide-react';
import { runCode } from '../../services/codeExecutor';
import type { SolveProblem } from '../../types/SolveProblem';

// ── Types ─────────────────────────────────────────────────────────────────────

type Language = 'javascript' | 'python' | 'java' | 'cpp';

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

// ── Constants ─────────────────────────────────────────────────────────────────

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
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'line',
  bracketPairColorization: { enabled: true },
  padding: { top: 12, bottom: 12 },
  scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
  overviewRulerLanes: 0,
};

// ── Component ─────────────────────────────────────────────────────────────────

interface ProblemSolveLevelProps {
  problem: SolveProblem;
  onBack: () => void;
}

export function ProblemSolveLevel({ problem, onBack }: ProblemSolveLevelProps) {
  const [language, setLanguage]       = useState<Language>('javascript');
  const [code]                        = useState<string>(problem.starter_code?.javascript ?? '');
  const [results, setResults]         = useState<TestResult[]>([]);
  const [running, setRunning]         = useState(false);
  const [busyBanner, setBusyBanner]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'description' | 'results'>('description');
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // ── Language switch ──────────────────────────────────────────────────────────
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    const starter = problem.starter_code?.[lang] ?? '';
    if (editorRef.current) {
      editorRef.current.setValue(starter);
    }
  };

  // ── Run code ─────────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (running) return;
    setBusyBanner(false);
    setRunning(true);
    setActiveTab('results');

    const testCases = problem.test_cases ?? [];
    // Initialise results with "running" state
    const initial: TestResult[] = testCases.map((tc, i) => ({
      index: i,
      input: tc.input,
      expected: tc.expected_output,
      actual: '',
      stderr: '',
      status: 'Queued',
      executionTime: 0,
      passed: false,
      running: true,
    }));
    setResults(initial);

    const langLabel = LANGUAGE_CONFIG[language].label;
    let anyBusy = false;

    const activeCode = editorRef.current?.getValue() ?? code;
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      setResults((prev) =>
        prev.map((r) => (r.index === i ? { ...r, running: true, status: 'Running…' } : r))
      );

      const result = await runCode({
        language: langLabel,
        code: activeCode,
        stdin: tc.input,
      });

      const isBusy =
        result.status === 'Timeout' ||
        result.stderr?.includes('execution service is busy');

      if (isBusy) anyBusy = true;

      const actualTrimmed   = result.stdout.trim();
      const expectedTrimmed = tc.expected_output.trim();
      const passed          = result.status === 'Accepted' && actualTrimmed === expectedTrimmed;

      setResults((prev) =>
        prev.map((r) =>
          r.index === i
            ? {
                ...r,
                running:       false,
                actual:        result.stdout,
                stderr:        result.stderr,
                status:        result.status,
                executionTime: result.executionTime,
                passed,
              }
            : r
        )
      );
    }

    if (anyBusy) setBusyBanner(true);
    setRunning(false);
  }, [running, problem, language, code]);

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const passCount = results.filter((r) => r.passed).length;
  const totalCount = problem.test_cases?.length ?? 0;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div
      className="absolute inset-0 flex flex-col bg-slate-950 overflow-hidden"
      style={{ left: '80px' }}
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 h-12 border-b border-white/5 bg-slate-900/80 backdrop-blur-md flex items-center px-4 gap-3">
        <button
          id="back-to-problems"
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Problems
        </button>
        <ChevronRight size={12} className="text-slate-700" />
        <span className="text-sm font-bold text-slate-200 truncate">{problem.title}</span>
        <span className={`ml-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DIFFICULTY_STYLE[problem.difficulty]}`}>
          {problem.difficulty}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-lg p-0.5">
            {(Object.keys(LANGUAGE_CONFIG) as Language[]).map((lang) => {
              const cfg = LANGUAGE_CONFIG[lang];
              return (
                <button
                  key={lang}
                  id={`lang-${lang}`}
                  onClick={() => handleLanguageChange(lang)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    language === lang
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cfg.icon}
                </button>
              );
            })}
          </div>

          {/* Run button */}
          <button
            id="run-code-btn"
            onClick={handleRun}
            disabled={running}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
              running
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-95'
            }`}
          >
            {running ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} className="fill-current" />
            )}
            {running ? 'Running…' : 'Run'}
          </button>
        </div>
      </div>

      {/* ── Busy banner ── */}
      {busyBanner && (
        <div className="shrink-0 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 flex items-center gap-3">
          <AlertCircle size={14} className="text-amber-400 shrink-0" />
          <span className="text-sm text-amber-300">
            Execution service is busy — some test cases may not have run. Try again.
          </span>
          <button
            onClick={() => setBusyBanner(false)}
            className="ml-auto text-amber-500 hover:text-amber-300 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main split ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Problem description + results tabs ── */}
        <div className="w-[38%] border-r border-white/5 flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-white/5 bg-slate-900/40">
            {[
              { id: 'description', label: 'Description', icon: FileCode2 },
              {
                id: 'results',
                label: results.length > 0
                  ? `Results ${!running ? `${passCount}/${totalCount}` : ''}`
                  : 'Results',
                icon: Terminal,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as 'description' | 'results')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Description panel */}
          {activeTab === 'description' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Title */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-slate-600">#{problem.id}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${DIFFICULTY_STYLE[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{problem.title}</h2>
              </div>

              {/* Tags */}
              {problem.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {problem.tags.map((t) => (
                    <span key={t} className="text-[10px] text-slate-500 bg-slate-800 border border-white/5 rounded-full px-2 py-0.5 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{problem.description}</p>

              {/* Examples */}
              {(problem.examples?.length ?? 0) > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Examples</h3>
                  {(problem.examples ?? []).map((ex, i) => (
                    <div key={i} className="bg-slate-900 border border-white/5 rounded-xl overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-800/50 border-b border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Example {i + 1}</span>
                      </div>
                      <div className="p-3 font-mono text-xs space-y-1.5">
                        <div><span className="text-slate-500">Input: </span><span className="text-slate-300">{ex.input}</span></div>
                        <div><span className="text-slate-500">Output: </span><span className="text-slate-300">{ex.output}</span></div>
                        {ex.explanation && (
                          <div className="text-slate-500 italic text-[11px] border-l-2 border-slate-700 pl-2 pt-1">{ex.explanation}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Constraints */}
              {(problem.constraints?.length ?? 0) > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={11} className="text-amber-500" /> Constraints
                  </h3>
                  <ul className="space-y-1.5">
                    {(problem.constraints ?? []).map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className="w-1 h-1 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Results panel */}
          {activeTab === 'results' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {results.length === 0 && (
                <div className="text-center py-16 text-slate-600 text-sm font-mono">
                  Click <span className="text-cyan-500 font-bold">Run</span> to test your code.
                </div>
              )}

              {/* Summary bar */}
              {results.length > 0 && !running && (
                <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border ${
                  passCount === totalCount
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-red-500/10 border-red-500/20'
                }`}>
                  {passCount === totalCount ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-red-400 shrink-0" />
                  )}
                  <span className={`text-sm font-bold ${passCount === totalCount ? 'text-emerald-300' : 'text-red-300'}`}>
                    {passCount === totalCount ? 'All Passed!' : `${passCount} / ${totalCount} Passed`}
                  </span>
                </div>
              )}

              {results.map((r) => (
                <div
                  key={r.index}
                  id={`result-case-${r.index}`}
                  className={`rounded-xl border overflow-hidden ${
                    r.running
                      ? 'border-cyan-500/20 bg-slate-900/60'
                      : r.passed
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  {/* Result header */}
                  <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
                    {r.running ? (
                      <Loader2 size={14} className="animate-spin text-cyan-400 shrink-0" />
                    ) : r.passed ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle size={14} className="text-red-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-slate-300">Case {r.index + 1}</span>
                    {!r.running && (
                      <>
                        <span className={`ml-auto text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${r.passed ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                          {r.passed ? 'Pass' : 'Fail'}
                        </span>
                        {r.executionTime > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                            <Clock size={10} />
                            {r.executionTime}ms
                          </span>
                        )}
                      </>
                    )}
                    {r.running && (
                      <span className="ml-auto text-[10px] text-cyan-500 font-mono animate-pulse">{r.status}</span>
                    )}
                  </div>

                  {/* Result body */}
                  {!r.running && (
                    <div className="p-3 space-y-2 font-mono text-xs">
                      <div>
                        <span className="text-slate-600">Input: </span>
                        <span className="text-slate-400">{r.input}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Expected: </span>
                        <span className="text-emerald-400">{r.expected}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Got: </span>
                        <span className={r.passed ? 'text-emerald-400' : 'text-red-400'}>
                          {r.actual || '(empty)'}
                        </span>
                      </div>
                      {r.stderr && (
                        <pre className="mt-2 p-2 bg-red-950/30 border border-red-500/20 rounded-lg text-red-400 text-[11px] whitespace-pre-wrap overflow-x-auto">
                          {r.stderr}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Monaco editor ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Editor header */}
          <div className="shrink-0 h-8 bg-slate-900/60 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500/70" />
            <div className="w-2 h-2 rounded-full bg-amber-500/70" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-[11px] font-mono text-slate-600">
              solution.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'cpp'}
            </span>
            <span className="ml-auto text-[11px] font-mono text-slate-700">
              {LANGUAGE_CONFIG[language].label}
            </span>
          </div>

          {/* Monaco */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={LANGUAGE_CONFIG[language].monacoLang}
              defaultValue={code}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="vs-dark"
              options={MONACO_OPTIONS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
