import { X, FileText, Terminal, AlertTriangle, ChevronRight } from 'lucide-react'
import type { LeetCodeProblem } from '../../types/LeetCodeProblem'

interface ProblemDetailsModalProps {
    problem: LeetCodeProblem
    onClose: () => void
}

export const ProblemDetailsModal = ({ problem, onClose }: ProblemDetailsModalProps) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-[95%] max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center text-cyan-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-white">{problem.title}</span>
                                <span className="text-sm font-mono text-slate-500">#{problem.leetcodeId}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${problem.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                    'border-red-500/30 text-red-400 bg-red-500/10'
                                }`}>
                                {problem.difficulty}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">

                    {/* Description */}
                    <div className="prose prose-invert max-w-none">
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                            {problem.description}
                        </p>
                    </div>

                    {/* I/O Description */}
                    {(problem.inputDescription || problem.outputDescription) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {problem.inputDescription && (
                                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <ChevronRight size={12} /> Input
                                    </h3>
                                    <p className="text-slate-300 text-sm">{problem.inputDescription}</p>
                                </div>
                            )}
                            {problem.outputDescription && (
                                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <ChevronRight size={12} /> Output
                                    </h3>
                                    <p className="text-slate-300 text-sm">{problem.outputDescription}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Examples */}
                    {problem.examples && problem.examples.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Terminal size={16} className="text-cyan-400" /> Examples
                            </h3>
                            {problem.examples.map((ex, i) => (
                                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                                    <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                                        Example {i + 1}
                                    </div>
                                    <div className="p-4 space-y-3 font-mono text-sm">
                                        <div>
                                            <span className="text-slate-500 select-none">Input: </span>
                                            <span className="text-slate-200">{ex.input}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 select-none">Output: </span>
                                            <span className="text-slate-200">{ex.output}</span>
                                        </div>
                                        {ex.explanation && (
                                            <div className="text-xs text-slate-400 italic mt-2 border-l-2 border-slate-700 pl-3 py-1">
                                                {ex.explanation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Constraints */}
                    {problem.constraints && problem.constraints.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-500" /> Constraints
                            </h3>
                            <ul className="space-y-2">
                                {problem.constraints.map((c, i) => (
                                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-800/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                                        <span className="font-mono">{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
