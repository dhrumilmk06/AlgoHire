import { useState, useEffect } from 'react'
import CameraControls from '../3d/CameraControls';
import { Canvas, useFrame } from '@react-three/fiber'
import { StackBox } from '../3d/StackBox'
import { CodeWindow } from '../ui/CodeWindow'
import { InfoModal } from '../InfoModal'
import { Info } from 'lucide-react'

const SNIPPET_PUSH = `// Push O(1)
if (top >= size) return;
stack[++top] = value;`

// const SNIPPET_POP = `// Pop O(1)
// if (top < 0) return;
// return stack[top--];`

type StackStep =
    | { type: "STACK_PUSH"; value: number }
    | { type: "STACK_POP" };

const STACK_BASE_Y = 0;
const STACK_ITEM_HEIGHT = 1.2;
const getStackY = (index: number) => STACK_BASE_Y + index * STACK_ITEM_HEIGHT;

const StackAnimator: React.FC<{
    activeAnimation: any;
    setActiveAnimation: (anim: any) => void;
    setStack: React.Dispatch<React.SetStateAction<number[]>>;
}> = ({ activeAnimation, setActiveAnimation, setStack }) => {
    useFrame((_, delta) => {
        if (!activeAnimation) return

        const SPEED = 4
        const newProgress = Math.min(activeAnimation.progress + delta * SPEED, 1)

        if (newProgress < 1) {
            setActiveAnimation({ ...activeAnimation, progress: newProgress })
        } else {
            // Animation Complete
            if (activeAnimation.type === "push") {
                setStack(prev => [...prev, activeAnimation.value])
            } else if (activeAnimation.type === "pop") {
                setStack(prev => prev.slice(0, -1))
            }
            setActiveAnimation(null)
        }
    })
    return null
}

const StackLevel: React.FC<{ showGrid: boolean }> = ({ showGrid }) => {
    const [stack, setStack] = useState<number[]>([10, 20, 30])
    // const [isAnimating, setIsAnimating] = useState(false)
    const [codeSnippet] = useState(SNIPPET_PUSH)
    const [highlightedLine] = useState<number | null>(null)
    const [showCode, setShowCode] = useState(false)
    const [codeTitle] = useState('Push')
    const [showInfo, setShowInfo] = useState(false)
    const [steps, setSteps] = useState<StackStep[]>([])
    const [activeAnimation, setActiveAnimation] = useState<{
        type: "push" | "pop";
        value: number;
        fromY: number;
        toY: number;
        progress: number;
    } | null>(null);

    const isAnimating = activeAnimation !== null;

    // Process steps and trigger animation
    useEffect(() => {
        if (activeAnimation || steps.length === 0) return

        const step = steps[0]

        // Dequeue the step immediately as we init animation
        setSteps(prev => prev.slice(1))

        if (step.type === "STACK_PUSH") {
            const targetIndex = stack.length;
            const toY = getStackY(targetIndex);
            const fromY = toY + 2;
            setActiveAnimation({
                type: "push",
                value: step.value,
                fromY,
                toY,
                progress: 0
            })
        } else if (step.type === "STACK_POP") {
            if (stack.length === 0) return
            const targetIndex = stack.length - 1;
            const fromY = getStackY(targetIndex);
            const toY = fromY + 2;
            const topVal = stack[stack.length - 1]
            setActiveAnimation({
                type: "pop",
                value: topVal,
                fromY,
                toY,
                progress: 0
            })
        }
    }, [steps, activeAnimation, stack.length, stack])

    const MAX_SIZE = 8

    const handlePush = (val: number) => {
        if (stack.length >= MAX_SIZE) return
        setSteps(prev => [...prev, { type: "STACK_PUSH", value: val }])
        console.log("Enqueued PUSH:", val)
    }

    const handlePop = () => {
        if (stack.length === 0) return
        setSteps(prev => [...prev, { type: "STACK_POP" }])
        console.log("Enqueued POP")
    }

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [5, 5, 20], fov: 50 }}>
                <StackAnimator
                    activeAnimation={activeAnimation}
                    setActiveAnimation={setActiveAnimation}
                    setStack={setStack}
                />

                {/* Camera Setup */}
                <CameraControls makeDefault minDistance={10} maxDistance={40} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -0.5, 0]} />}

                {/* Render Stack from Bottom Up */}
                {stack.map((val, i) => {
                    // Hide top element if popping to prevent double rendering
                    if (activeAnimation?.type === "pop" && i === stack.length - 1) return null;

                    return (
                        <group key={i} position={[0, getStackY(i), 0]}>
                            <StackBox value={val} />
                        </group>
                    )
                })}

                {/* Render Active Animation */}
                {activeAnimation && (
                    <group position={[0, activeAnimation.fromY + (activeAnimation.toY - activeAnimation.fromY) * activeAnimation.progress, 0]}>
                        <StackBox value={activeAnimation.value} />
                    </group>
                )}
            </Canvas>

            {/* UI Overlay - Sibling to Canvas */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 pointer-events-auto flex items-center justify-between p-4 z-50">
                {/* Left Section: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">STACK (LIFO)</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Count: {stack.length} / {MAX_SIZE}</div>
                </div>

                {/* Center Section: Controls */}
                <div className="flex items-center gap-6">
                    {/* Push */}
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-800 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            placeholder="Val"
                            id="push-input"
                        />
                        <button
                            onClick={() => {
                                const val = parseInt((document.getElementById('push-input') as HTMLInputElement).value);
                                if (!isNaN(val)) handlePush(val);
                            }}
                            disabled={isAnimating || stack.length >= MAX_SIZE}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Push
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-700"></div>

                    {/* Pop */}
                    <button
                        onClick={handlePop}
                        disabled={isAnimating || stack.length === 0}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Pop
                    </button>
                </div>

                {/* Right Section: Code Toggle & Info */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/40"
                        title="Show Info"
                    >
                        <Info size={20} />
                    </button>

                    <button
                        onClick={() => setShowCode(!showCode)}
                        className={`p-2 rounded-lg transition-colors border ${showCode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}
                        title="Toggle Code Window"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                </div>
            </div>


            {/* Code Window - Independent */}
            {
                showCode && (
                    <div className="absolute top-20 right-5 pointer-events-auto z-20">
                        <CodeWindow
                            code={codeSnippet}
                            highlightedLine={highlightedLine}
                            title={codeTitle}
                            onClose={() => setShowCode(false)}
                        />
                    </div>
                )
            }

            {/* Info Modal */}
            {
                showInfo && (
                    <InfoModal
                        type="STACK"
                        onClose={() => setShowInfo(false)}
                    />
                )
            }
        </div >
    )
}

export { StackLevel }
