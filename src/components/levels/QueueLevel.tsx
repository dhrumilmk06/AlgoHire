import { useState } from 'react'
import { Text } from '@react-three/drei'
import CameraControls from '../3d/CameraControls'
import { Canvas } from '@react-three/fiber'
import { QueueSphere } from '../3d/QueueSphere'
import { CodeWindow } from '../ui/CodeWindow'
import { InfoModal } from '../InfoModal'
import { Info } from 'lucide-react'

const SNIPPET_ENQUEUE = `// Enqueue
if (rear == MAX - 1) return;
if (front == -1) front = 0;
queue[++rear] = value;`
const SNIPPET_DEQUEUE = `// Dequeue
if (front == -1) return;
int val = queue[front];
if (front == rear) front = rear = -1;
else front++;`

export const QueueLevel = ({ showGrid }: { showGrid: boolean }) => {
    // We visualize a circular buffer or just a linear track for simplicity
    const [queue, setQueue] = useState<number[]>([])
    const [isAnimating, setIsAnimating] = useState(false)
    const [codeSnippet, setCodeSnippet] = useState(SNIPPET_ENQUEUE)
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
    const [codeTitle, setCodeTitle] = useState('Enqueue')
    const [showCode, setShowCode] = useState(false)
    const [showInfo, setShowInfo] = useState(false)

    const MAX_SIZE = 10

    const handleEnqueue = async (val: number) => {
        if (queue.length >= MAX_SIZE) return
        setIsAnimating(true)
        setCodeTitle('Enqueue')
        setCodeSnippet(SNIPPET_ENQUEUE)

        // 1. Check Full
        setHighlightedLine(2)
        await new Promise(r => setTimeout(r, 600))

        // 2. Check Front
        setHighlightedLine(3)
        await new Promise(r => setTimeout(r, 600))

        // 3. Insert and Increment Rear
        setHighlightedLine(4)
        setQueue(prev => [...prev, val])
        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(null)
        setIsAnimating(false)
    }

    const handleDequeue = async () => {
        if (queue.length === 0) return
        setIsAnimating(true)
        setCodeTitle('Dequeue')
        setCodeSnippet(SNIPPET_DEQUEUE)

        // 1. Check Empty
        setHighlightedLine(2)
        await new Promise(r => setTimeout(r, 600))

        // 2. Retrieve Value
        setHighlightedLine(3)
        await new Promise(r => setTimeout(r, 600))

        // 3. Reset or Increment Front
        setHighlightedLine(4) // or 5
        setQueue(prev => prev.slice(1))
        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(null)
        setIsAnimating(false)
    }

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [5, 5, 10], fov: 50 }}>
                <CameraControls makeDefault />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -1, 0]} />}

                {/* Tunnel / Track Visualization */}
                <mesh position={[MAX_SIZE / 2 - 0.5, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[MAX_SIZE * 2, 4]} />
                    <meshStandardMaterial color="#002233" transparent opacity={0.5} />
                </mesh>

                <Text position={[-2, 0, 0]} fontSize={0.5} color="#facc15">FRONT</Text>
                <Text position={[MAX_SIZE + 1, 0, 0]} fontSize={0.5} color="#facc15">REAR</Text>

                {queue.map((val, i) => (
                    <group key={`${val}-${i}`} position={[i * 1.5, 0, 0]}>
                        <QueueSphere value={val} />
                    </group>
                ))}
            </Canvas>

            {/* UI Dock (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                {/* Left Section: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">QUEUE (FIFO)</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Count: {queue.length} / {MAX_SIZE}</div>
                </div>

                {/* Center Section: Controls */}
                <div className="flex items-center gap-6">
                    {/* Enqueue */}
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            placeholder="Val"
                            id="enqueue-input"
                        />
                        <button
                            onClick={() => {
                                const val = parseInt((document.getElementById('enqueue-input') as HTMLInputElement).value);
                                if (!isNaN(val)) handleEnqueue(val);
                            }}
                            disabled={isAnimating || queue.length >= MAX_SIZE}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Enqueue
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-800"></div>

                    {/* Dequeue */}
                    <button
                        onClick={handleDequeue}
                        disabled={isAnimating || queue.length === 0}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Dequeue
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
                        title="Code Window (Always On)"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                </div>
            </div>


            {/* Code Window (Top Right) */}
            {
                showCode && (
                    <div className="absolute top-20 right-5 z-20 pointer-events-auto">
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
                        type="QUEUE"
                        onClose={() => setShowInfo(false)}
                    />
                )
            }
        </div >
    )
}
