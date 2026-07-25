import { useState, useEffect, useMemo, useCallback, Component, lazy } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import CameraControls from '../3d/CameraControls'
import type { Step } from '../../types/Algorithm'
import { RotateCcw, Play, Pause, Search, ArrowLeft, Filter, Hash } from 'lucide-react'
import { CodeWindow } from '../ui/CodeWindow'
import { problems } from '../../data/leetcodeProblems'
import type { LeetCodeProblem, Difficulty } from '../../types/LeetCodeProblem'
import { ProblemDetailsModal } from '../ui/ProblemDetailsModal'
import { VerticalResizeHandle } from '../ui/VerticalResizeHandle'
import { USE_NEW_IMPL } from '../../algorithms/leetcode/array/twoSum'
import { explainIslandStep } from '../../algorithms/leetcode/grid/200/explain'
import { ExplanationPanel } from '../ExplanationPanel'
import { useEngine } from '../../core/engine/EngineController'
import { getProblemDefinition } from '../../problems/ProblemRegistry'

// Code-split heavy visualizers
const DefaultArrayVisualizer = lazy(() => import('../visualizers/DefaultArrayVisualizer').then(m => ({ default: m.DefaultArrayVisualizer })))
const LinkedListVisualizer = lazy(() => import('../visualizers/LinkedListVisualizer').then(m => ({ default: m.LinkedListVisualizer })))
const ArrayRenderer = lazy(() => import('../../families/array/ArrayRenderer').then(m => ({ default: m.ArrayRenderer })))


// --- ERROR BOUNDARY ---
class SimpleErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: ReactNode }) {
        super(props)
        this.state = { hasError: false, error: null }
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
    }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("LeetCodeLevel Crash:", error, errorInfo)
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-10 text-red-500 bg-slate-900 h-full flex flex-col items-center justify-center">
                    <h2 className="text-2xl font-bold mb-4">Something went wrong.</h2>
                    <pre className="bg-black/50 p-4 rounded text-sm">{this.state.error?.message}</pre>
                    <button onClick={() => this.setState({ hasError: false })} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">Retry</button>
                </div>
            )
        }
        return this.props.children
    }
}

// --- WORKSPACE COMPONENT ---
const ProblemWorkspace = ({ problem, onBack, showGrid }: { problem: LeetCodeProblem, onBack: () => void, showGrid: boolean }) => {
    // 1. Safe State Initialization
    const [target, setTarget] = useState<number>(problem?.defaultTarget ?? 9)
    const [steps, setSteps] = useState<Step[]>([])
    const [inputText, setInputText] = useState(problem?.defaultInput ?? "")
    const [showDetails, setShowDetails] = useState(false)

    // Legacy State (for non-engine problems)
    const [legacyCurrentStepIndex, setLegacyCurrentStepIndex] = useState(-1)
    const [legacyIsRunning, setLegacyIsRunning] = useState(false)
    const [legacySpeed, setLegacySpeed] = useState(1)

    // Variant Management
    const variants = problem?.variants ?? {}
    const variantKeys = Object.keys(variants)
    const [variant, setVariant] = useState<string>(variantKeys.length > 0 ? variantKeys[0] : '')

    // Visual State (Generic)
    const [visualData, setVisualData] = useState<any>(null)
    const isLinkedList = problem.tags.includes('Linked List')

    // Resize State
    const [leftWidth, setLeftWidth] = useState(450)
    const [isResizing, setIsResizing] = useState(false)

    // Resize Handlers
    const startResize = useCallback((e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault()
    }, [])

    const stopResize = useCallback(() => {
        setIsResizing(false)
    }, [])

    const doResize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX - 80
            if (newWidth >= 300 && newWidth <= 700) {
                setLeftWidth(newWidth)
            }
        }
    }, [isResizing])

    // Global Event Listeners for Resize
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', doResize)
            window.addEventListener('mouseup', stopResize)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        } else {
            window.removeEventListener('mousemove', doResize)
            window.removeEventListener('mouseup', stopResize)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        return () => {
            window.removeEventListener('mousemove', doResize)
            window.removeEventListener('mouseup', stopResize)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, doResize, stopResize])

    // Parsing Logic
    const parseInput = (text: string) => {
        if (!text) return []
        try {
            const trimmed = text.trim()
            if (trimmed.startsWith('[')) {
                return JSON.parse(`[${trimmed}]`)
            } else if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
                return trimmed.replace(/^['"]|['"]$/g, '').split('')
            } else {
                const nums = trimmed.split(',').map(s => parseInt(s.trim()))
                if (nums.every(n => !isNaN(n))) {
                    return nums
                }
                return trimmed.split('')
            }
        } catch (e) {
            return text.split('')
        }
    }

    const currentVariant = variants[variant]

    // Effect: Initialize Data
    useEffect(() => {
        try {
            const parsed = parseInput(inputText)
            if (parsed) {
                setVisualData(parsed)
                if (currentVariant) {
                    const calculatedSteps = currentVariant.run(parsed, target)
                    setSteps(calculatedSteps || [])
                }
            }
            // Reset logic
            setLegacyCurrentStepIndex(-1)
            setLegacyIsRunning(false)
        } catch (e) {
            console.error("Error initializing problem data:", e)
        }
    }, [inputText, target, variant, currentVariant])

    const problemDef = getProblemDefinition(problem.leetcodeId);


    // Actually, to make this work Cleanly:
    // We need the adapter to exist.
    const adapter = useMemo(() => {
        if (problemDef && steps.length > 0 && visualData) {
            return problemDef.adapterFactory(steps, visualData);
        }
        return null;
    }, [problemDef, steps, visualData]);

    // Now feed adapter to engine.
    // The engine hook handles the state.
    const {
        currentStepIndex: engineStepIndex,
        snapshot: engineSnapshot,
        isRunning: engineIsRunning,
        speed: engineSpeed,
        togglePlay, reset, setSpeed
    } = useEngine(adapter);

    // Disclaimer: `useEngine` manages state. `adapter` is the source of truth.
    // `ProblemBoundary` requirement: "Adapter is created once... disposed exactly once"
    // The `useMemo` above creates it.
    // We need to dispose it when component unmounts or adapter changes.
    useEffect(() => {
        return () => {
            if (adapter) {
                adapter.dispose();
            }
        };
    }, [adapter]);
    // This effectively implements "ProblemBoundary" logic inline or we can wrap the visualizer.
    // For compliance with "Refactor LeetCodeLevel to use ProblemBoundary", 
    // we can use the component in the JSX to wrap the visualizer.
    // But the Engine needs the adapter "now" for controls.

    // UNIFICATION
    // - If problemDef exists -> Use Engine State
    // - Else -> Use Legacy State

    const isEngineMode = !!problemDef;

    const currentStepIndex = isEngineMode ? engineStepIndex : legacyCurrentStepIndex;
    const isRunning = isEngineMode ? engineIsRunning : legacyIsRunning;
    const speed = isEngineMode ? engineSpeed : legacySpeed;

    // Legacy Interval Loop
    useEffect(() => {
        if (!isEngineMode && isRunning) {
            const interval = setInterval(() => {
                setLegacyCurrentStepIndex(prev => {
                    if (prev >= steps.length - 1) {
                        setLegacyIsRunning(false)
                        return prev
                    }
                    return prev + 1
                })
            }, 1000 / speed)
            return () => clearInterval(interval)
        }
    }, [isEngineMode, isRunning, steps.length, speed]);

    // Handlers
    const handleTogglePlay = () => {
        if (isEngineMode) {
            togglePlay();
        } else {
            // Legacy Logic
            if (legacyIsRunning) {
                setLegacyIsRunning(false)
            } else {
                if (steps.length > 0 && legacyCurrentStepIndex < steps.length - 1 && legacyCurrentStepIndex !== -1) {
                    setLegacyIsRunning(true)
                } else {
                    // Reset/Start Fresh
                    setLegacyCurrentStepIndex(-1)
                    setLegacyIsRunning(true)
                }
            }
        }
    }

    const handleReset = () => {
        if (isEngineMode) {
            reset();
        } else {
            setLegacyIsRunning(false)
            setLegacyCurrentStepIndex(-1)
        }
    }

    const currentStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null

    const useNewRenderer = problem.leetcodeId === 1 && USE_NEW_IMPL;

    // Fallback
    if (!problem || !currentVariant) {
        return (
            <div className="absolute inset-0 left-20 bg-slate-950 flex flex-col items-center justify-center text-red-400">
                <h2 className="text-xl font-bold">Problem Data Error</h2>
                <p>Could not load the selected variant.</p>
                <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 rounded text-white">Back</button>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 left-20 flex flex-row bg-slate-950 overflow-hidden">
            {/* Modal */}
            {showDetails && <ProblemDetailsModal problem={problem} onClose={() => setShowDetails(false)} />}

            {/* LEFT PANEL */}
            <div
                style={{ width: leftWidth }}
                className="flex flex-col border-r border-slate-800 bg-slate-950 z-10 shadow-xl shrink-0"
            >
                <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-xs font-bold uppercase tracking-wider">
                        <ArrowLeft size={14} /> Back to Problems
                    </button>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-mono font-bold text-cyan-400">#{problem.leetcodeId}</span>
                            <h2 className="text-xl font-bold text-white">{problem.title}</h2>
                        </div>
                        <button
                            onClick={() => setShowDetails(true)}
                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-cyan-900/50 text-slate-400 hover:text-cyan-400 flex items-center justify-center transition-colors border border-slate-700 hover:border-cyan-500/50"
                            title="View Problem Details"
                        >
                            <span className="font-bold text-sm">?</span>
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
                    {/* Variant Selector */}
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Algorithm Variant</label>
                        <select
                            value={variant}
                            onChange={(e) => setVariant(e.target.value)}
                            className="bg-slate-900 border border-slate-700 text-xs text-slate-300 font-bold px-2 py-1.5 rounded outline-none focus:border-cyan-500 uppercase tracking-wide cursor-pointer"
                        >
                            {Object.values(variants).map(v => (
                                <option key={v.id} value={v.id}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className={isLinkedList ? "col-span-3 flex flex-col gap-2" : "col-span-2 flex flex-col gap-2"}>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Input {isLinkedList ? '(Arrays)' : 'Array'}</label>
                            <input
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-sm outline-none focus:border-cyan-500 w-full"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={isLinkedList ? "[2,4,3], [5,6,4]" : "2, 7, 11, 15"}
                            />
                        </div>
                        {problem.requiresTarget && (
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target</label>
                                <input
                                    type="number"
                                    className="bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 font-mono text-sm outline-none focus:border-cyan-500 w-full"
                                    value={target}
                                    onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Values Display for LL */}
                    {isLinkedList && currentStep && currentStep.values && (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                            <div className="flex flex-col">
                                <span className="text-slate-500 uppercase">Carry</span>
                                <span className="text-yellow-400 font-bold text-lg">{currentStep.values.carry ?? '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 uppercase">Sum</span>
                                <span className="text-cyan-400 font-bold text-lg">{currentStep.values.sum ?? '-'}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500 uppercase">Digit</span>
                                <span className="text-green-400 font-bold text-lg">{currentStep.values.digit ?? '-'}</span>
                            </div>
                        </div>
                    )}

                    {/* Code Window */}
                    <div className="flex-1 min-h-0 flex flex-col border border-slate-800 rounded-xl overflow-hidden shadow-inner bg-black/50">
                        <CodeWindow
                            variant="embedded"
                            code={currentVariant.code || '// No code available'}
                            highlightedLine={currentStep?.line ?? null}
                            title="Solution.java"
                        />
                    </div>
                    {/* Message */}
                    <div className="h-16 bg-slate-900/50 border-t border-slate-800 p-3 flex items-center justify-center text-center">
                        {currentStep ? (
                            <div className="text-sm font-bold text-cyan-100">{currentStep.message}</div>
                        ) : (
                            <div className="text-slate-600 italic text-sm">Ready to execute...</div>
                        )}
                    </div>
                </div>

                {/* Execution Controls */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                            <span>Speed</span><span className="text-cyan-400">{speed}x</span>
                        </div>
                        <input type="range" min="0.5" max="5" step="0.5" value={speed}
                            onChange={(e) => isEngineMode ? setSpeed(parseFloat(e.target.value)) : setLegacySpeed(parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleReset} className="p-2 text-slate-400 hover:text-white transition-colors" title="Reset"><RotateCcw size={20} /></button>
                        <button onClick={handleTogglePlay} className={`px-6 py-2 rounded font-bold shadow-lg transition-all flex items-center gap-2 ${isRunning ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-900/20' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20 active:scale-95'}`}>
                            {isRunning ? <>PAUSE <Pause size={16} fill="currentColor" /></> : <>PLAY <Play size={16} fill="currentColor" /></>}
                        </button>
                    </div>
                </div>
            </div>

            {/* RESIZE HANDLE */}
            <VerticalResizeHandle onMouseDown={startResize} isDragging={isResizing} />


            {/* RIGHT PANEL - 3D */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950 min-w-0">
                {useNewRenderer ? (
                    <div className="absolute inset-0 flex items-center justify-center p-8 bg-slate-900">
                        <ArrayRenderer visualData={visualData} steps={steps} currentStepIndex={currentStepIndex} />
                    </div>
                ) : (
                    <Canvas camera={{ position: [5, 5, 15], fov: 45 }}>
                        <CameraControls makeDefault dollySpeed={1.5} azimuthRotateSpeed={1.5} polarRotateSpeed={1.5} truckSpeed={2.5} smoothTime={0.25} />
                        {showGrid && <gridHelper args={[50, 50, 0x334155, 0x1e293b]} position={[0, -2, 0]} />}
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[5, 10, 5]} intensity={1} />

                        {visualData && (
                            problemDef ? (
                                (() => {
                                    const Visualizer = problemDef.visualizer;
                                    return <Visualizer snapshot={engineSnapshot} />
                                })()
                            ) : (
                                // LEGACY FALLBACK
                                // Determine fallback visualizer
                                (() => {
                                    const Visualizer = problem.tags.includes('Linked List') ? LinkedListVisualizer : DefaultArrayVisualizer
                                    return <Visualizer
                                        visualData={visualData}
                                        steps={steps}
                                        currentStepIndex={currentStepIndex}
                                    />
                                })()
                            )
                        )}
                    </Canvas>
                )}
                {/* Explanation Panel for Problem #200 */}
                {problem.leetcodeId === 200 && currentStep && (
                    <ExplanationPanel text={explainIslandStep(currentStep)} />
                )}
            </div>
        </div>
    )
}

// --- MAIN LEVEL COMPONENT ---
export const LeetCodeLevel = ({ showGrid }: { showGrid: boolean }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All')

    // 2. Safe Data Loading
    const safeProblems = Array.isArray(problems) ? problems : []

    // 3. Robust Filtering
    const filteredProblems = useMemo(() => {
        return safeProblems.filter(p => {
            if (!p) return false
            const matchesSearch = (p.leetcodeId?.toString() || "").includes(searchQuery) ||
                (p.title?.toLowerCase() || "").includes(searchQuery.toLowerCase())
            const matchesDiff = filterDifficulty === 'All' || p.difficulty === filterDifficulty
            return matchesSearch && matchesDiff
        })
    }, [searchQuery, filterDifficulty, safeProblems])

    const selectedProblem = useMemo(() => {
        if (!selectedId) return null
        return safeProblems.find(p => p.leetcodeId === selectedId)
    }, [selectedId, safeProblems])

    // 4. Render selection
    if (selectedProblem) {
        return (
            <SimpleErrorBoundary>
                <ProblemWorkspace problem={selectedProblem} onBack={() => setSelectedId(null)} showGrid={showGrid} />
            </SimpleErrorBoundary>
        )
    }

    return (
        <div className="absolute inset-0 left-20 bg-slate-950 flex flex-col overflow-hidden">
            {/* Dashboard Header */}
            <div className="p-8 pb-4 border-b border-slate-800 bg-slate-900/50">
                <div className="max-w-6xl mx-auto w-full">
                    <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="bg-gradient-to-r from-orange-400 to-orange-600 text-transparent bg-clip-text">LeetCode</span>
                        <span className="text-slate-600 text-lg font-normal">/ Problem Discovery</span>
                    </h1>

                    {/* Search & Filter */}
                    <div className="flex gap-4 items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                placeholder="Search ID or Title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 min-w-[150px]">
                            <Filter size={16} className="text-slate-500" />
                            <select
                                className="bg-transparent text-slate-300 text-sm font-medium outline-none w-full cursor-pointer"
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value as any)}
                            >
                                <option value="All">All Difficulty</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProblems.map(problem => (
                        <div
                            key={problem.leetcodeId}
                            onClick={() => setSelectedId(problem.leetcodeId)}
                            className="group bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/50 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-900/10 flex flex-col gap-4"
                        >
                            <div className="flex justify-between items-start">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${problem.difficulty === 'Easy' ? 'border-green-500/30 text-green-400 bg-green-500/10' : problem.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                    {problem.difficulty}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400 group-hover:bg-cyan-950/30 transition-colors">
                                    <Play size={14} fill="currentColor" />
                                </div>
                            </div>

                            <div>
                                <div className="text-2xl font-mono font-bold text-slate-600 mb-1 group-hover:text-cyan-500/50 transition-colors">#{problem.leetcodeId}</div>
                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{problem.title}</h3>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800/50">
                                {problem.tags.map(tag => (
                                    <span key={tag} className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                        <Hash size={10} /> {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredProblems.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-500 italic flex flex-col items-center gap-4">
                            <Search size={48} className="text-slate-800" />
                            <span>No problems found matching your criteria.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
