import { useState, useEffect } from 'react';
import { Search, Tag, ChevronRight, Code2, Loader2, TriangleAlert } from 'lucide-react';
import { fetchProblems } from '../../services/problemsService';
import type { SolveProblem, Difficulty } from '../../types/SolveProblem';

interface ProblemsListLevelProps {
  onSolveProblem: (problem: SolveProblem) => void;
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bg: string; border: string }> = {
  Easy:   { label: 'Easy',   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Medium: { label: 'Medium', color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  Hard:   { label: 'Hard',   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'     },
};

export function ProblemsListLevel({ onSolveProblem }: ProblemsListLevelProps) {
  const [problems, setProblems] = useState<SolveProblem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState<Difficulty | 'All'>('All');

  useEffect(() => {
    setLoading(true);
    fetchProblems()
      .then(setProblems)
      .catch(() => setError('Failed to load problems.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesDiff = filter === 'All' || p.difficulty === filter;
    return matchesSearch && matchesDiff;
  });

  const counts = {
    All:    problems.length,
    Easy:   problems.filter((p) => p.difficulty === 'Easy').length,
    Medium: problems.filter((p) => p.difficulty === 'Medium').length,
    Hard:   problems.filter((p) => p.difficulty === 'Hard').length,
  };

  return (
    <div className="absolute inset-0 bg-slate-950 flex flex-col overflow-hidden" style={{ left: '80px' }}>

      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/5 bg-slate-900/60 backdrop-blur-md px-8 py-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Code2 size={16} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Problem Set</h1>
        </div>
        <p className="text-sm text-slate-500 font-mono ml-11">
          Write · Run · Verify — real code execution via Judge0
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="shrink-0 px-8 py-4 flex items-center gap-4 border-b border-white/5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="problem-search"
            type="text"
            placeholder="Search problems or tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition"
          />
        </div>

        {/* Difficulty filter chips */}
        <div className="flex items-center gap-2">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map((d) => {
            const cfg = d === 'All' ? null : DIFFICULTY_CONFIG[d];
            const isActive = filter === d;
            return (
              <button
                key={d}
                id={`filter-${d.toLowerCase()}`}
                onClick={() => setFilter(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? d === 'All'
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                      : `${cfg!.bg} ${cfg!.border} ${cfg!.color}`
                    : 'bg-transparent border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                {d} <span className="opacity-60 ml-0.5">({counts[d]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading && (
          <div className="flex items-center justify-center h-48 gap-3 text-slate-500">
            <Loader2 size={20} className="animate-spin text-cyan-500" />
            <span className="text-sm font-mono">Loading problems…</span>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 text-red-400 text-sm">
            <TriangleAlert size={16} />
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20 text-slate-600 font-mono text-sm">
            No problems match your search.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((problem, idx) => {
              const cfg = DIFFICULTY_CONFIG[problem.difficulty];
              return (
                <button
                  key={problem.id}
                  id={`problem-card-${problem.id}`}
                  onClick={() => onSolveProblem(problem)}
                  className="group text-left bg-slate-900/60 border border-white/5 rounded-xl p-5 hover:border-cyan-500/30 hover:bg-slate-800/60 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all duration-200 flex flex-col gap-3"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Top row: id + difficulty */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-600">#{problem.id}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                    {problem.title}
                  </h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-800 border border-white/5 rounded-full px-2 py-0.5"
                      >
                        <Tag size={8} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Test cases count + arrow */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                    <span className="text-[11px] font-mono text-slate-600">
                      {problem.test_cases?.length ?? 0} test case{(problem.test_cases?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
