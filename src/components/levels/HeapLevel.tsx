import { useState } from 'react';
import { Text, Sphere, Line, Box, Edges } from '@react-three/drei';
import CameraControls from '../3d/CameraControls';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { CodeWindow } from '../ui/CodeWindow';
import { InfoModal } from '../InfoModal';
import { Info } from 'lucide-react';

// --- Constants ---
const ROOT_POS: [number, number, number] = [0, 5, 0];
const NODE_RADIUS = 0.6;
const ARRAY_Y_POS = -2;

// Colors
const COLOR_NODE_FACE = '#3b0764'; // Deep Purple
const COLOR_NODE_WIRE = '#f97316'; // Neon Orange
const COLOR_HIGHLIGHT = '#facc15'; // Yellow

// Snippets
const INSERT_CODE = `// Max Heap Insert
heap.push(val);
int i = heap.size() - 1;
while (i > 0) {
  int p = parent(i);
  if (heap[p] < heap[i]) {
    swap(heap[p], heap[i]);
    i = p;
  } else break;
}`;

const EXTRACT_CODE = `// Extract Max
int max = heap[0];
heap[0] = heap.back();
heap.pop_back();
heapifyDown(0);
// heapifyDown: swap with
// larger child until valid`;

// --- UI Components ---

/** 3D Node for Tree View */
const HeapNode = ({ position, value, isHighlighted, isSwapping }: { position: [number, number, number], value: number, isHighlighted: boolean, isSwapping: boolean }) => {
    const { scale, color } = useSpring({
        scale: isHighlighted || isSwapping ? 1.2 : 1,
        color: isHighlighted ? COLOR_HIGHLIGHT : COLOR_NODE_WIRE,
        config: config.wobbly
    });

    return (
        <animated.group position={position} scale={scale}>
            <Sphere args={[NODE_RADIUS, 32, 32]}>
                <meshStandardMaterial color={COLOR_NODE_FACE} roughness={0.2} metalness={0.8} />
            </Sphere>
            <Sphere args={[NODE_RADIUS + 0.05, 16, 16]}>
                {/* @ts-ignore */}
                <animated.meshBasicMaterial wireframe color={color} />
            </Sphere>
            <Text position={[0, 0, NODE_RADIUS + 0.2]} fontSize={0.5} color="white" anchorX="center" anchorY="middle">
                {value}
            </Text>
        </animated.group>
    );
};

/** Connection Line */
const Connection = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
    return (
        <Line points={[start, end]} color={COLOR_NODE_WIRE} lineWidth={2} transparent opacity={0.6} />
    );
};

/** Array Box for Flat View */
const ArrayItem = ({ index, value, isHighlighted }: { index: number, value: number, isHighlighted: boolean }) => {
    return (
        <group position={[index * 1.5 - 5, ARRAY_Y_POS, 0]}>
            <Box args={[1.2, 1.2, 1.2]}>
                <meshStandardMaterial color={isHighlighted ? COLOR_HIGHLIGHT : '#1e293b'} />
                <Edges color={COLOR_NODE_WIRE} />
            </Box>
            <Text position={[0, 0, 0.7]} fontSize={0.4} color="white">
                {value}
            </Text>
            <Text position={[0, -0.8, 0]} fontSize={0.25} color="#94a3b8">
                {index}
            </Text>
        </group>
    );
};

// --- Helper: Position Calculation ---
const getTreePosition = (index: number): [number, number, number] => {
    if (index === 0) return ROOT_POS;
    const level = Math.floor(Math.log2(index + 1));
    const parentIndex = Math.floor((index - 1) / 2);
    const parentPos = getTreePosition(parentIndex);

    // Determine if left or right child
    const isLeft = index % 2 !== 0;
    const offset = 8 / Math.pow(2, level); // Reduce spread by level

    return [
        parentPos[0] + (isLeft ? -offset : offset),
        parentPos[1] - 2,
        0
    ];
};

export const HeapLevel = ({ showGrid }: { showGrid: boolean }) => {
    const [heap, setHeap] = useState<number[]>([50, 30, 20, 15, 10, 8, 16]);
    const [inputValue, setInputValue] = useState('');
    const [message, setMessage] = useState('Max Heap Ready');
    const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);

    // Code Window
    const [showCode, setShowCode] = useState(false);
    const [codeSnippet, setCodeSnippet] = useState(INSERT_CODE);
    const [codeTitle, setCodeTitle] = useState('Max Heap Insert');
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    // --- Logic ---

    const bubbleUp = async (currentHeap: number[]) => {
        let idx = currentHeap.length - 1;

        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);

            setHighlightedIndices([idx, parentIdx]);
            setMessage(`Comparing ${currentHeap[idx]} > ${currentHeap[parentIdx]}?`);
            setHighlightedLine(4); // Code line
            await new Promise(r => setTimeout(r, 800));

            if (currentHeap[idx] > currentHeap[parentIdx]) {
                setMessage("Swapping...");
                setHighlightedLine(5);

                // Swap
                [currentHeap[idx], currentHeap[parentIdx]] = [currentHeap[parentIdx], currentHeap[idx]];
                setHeap([...currentHeap]); // Update visual
                await new Promise(r => setTimeout(r, 800));

                idx = parentIdx;
            } else {
                setMessage("Heap Property Satisfied.");
                break;
            }
        }
        setHighlightedIndices([]);
        setHighlightedLine(null);
    };

    const handleInsert = async () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        if (isAnimating) return;

        setIsAnimating(true);
        setCodeSnippet(INSERT_CODE);
        setCodeTitle('Max Heap Insert');
        setMessage(`Inserting ${val}`);
        setInputValue('');

        const newHeap = [...heap, val];
        setHeap(newHeap);
        setHighlightedLine(1); // push
        await new Promise(r => setTimeout(r, 800));

        await bubbleUp(newHeap);
        setIsAnimating(false);
    };

    const heapifyDown = async (currentHeap: number[]) => {
        let idx = 0;
        const length = currentHeap.length;

        while (true) {
            let leftChildIdx = 2 * idx + 1;
            let rightChildIdx = 2 * idx + 2;
            let largest = idx;

            if (leftChildIdx < length && currentHeap[leftChildIdx] > currentHeap[largest]) {
                largest = leftChildIdx;
            }

            if (rightChildIdx < length && currentHeap[rightChildIdx] > currentHeap[largest]) {
                largest = rightChildIdx;
            }

            if (largest !== idx) {
                setHighlightedIndices([idx, largest]);
                setMessage(`Swapping ${currentHeap[idx]} with larger child ${currentHeap[largest]}`);
                await new Promise(r => setTimeout(r, 800));

                [currentHeap[idx], currentHeap[largest]] = [currentHeap[largest], currentHeap[idx]];
                setHeap([...currentHeap]);
                await new Promise(r => setTimeout(r, 800));

                idx = largest;
            } else {
                break;
            }
        }
        setHighlightedIndices([]);
    };

    const handleExtractMax = async () => {
        if (heap.length === 0 || isAnimating) return;

        setIsAnimating(true);
        setCodeSnippet(EXTRACT_CODE);
        setCodeTitle('Extract Max');

        setMessage(`Extracted Max: ${heap[0]}`);
        setHighlightedLine(1);
        await new Promise(r => setTimeout(r, 800));

        const newHeap = [...heap];
        // Move last to root
        newHeap[0] = newHeap[newHeap.length - 1];
        newHeap.pop();
        setHeap([...newHeap]);

        setHighlightedLine(2); // swap/pop
        await new Promise(r => setTimeout(r, 800));

        await heapifyDown(newHeap);
        setMessage("Heap Property Restored");
        setIsAnimating(false);
        setHighlightedLine(null);
    };

    const handleClear = () => {
        setHeap([]);
        setMessage("Heap Cleared");
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [0, 5, 20], fov: 50 }}>
                <CameraControls makeDefault minDistance={5} maxDistance={30} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -3, 0]} />}

                {/* Tree Visualization */}
                <group position={[0, 0, 0]}>
                    {heap.map((val, i) => {
                        const pos = getTreePosition(i);
                        const parentIdx = Math.floor((i - 1) / 2);
                        const parentPos = i > 0 ? getTreePosition(parentIdx) : null;

                        return (
                            <group key={`node-${i}`}>
                                <HeapNode
                                    position={pos}
                                    value={val}
                                    isHighlighted={highlightedIndices.includes(i)}
                                    isSwapping={false}
                                />
                                {parentPos && <Connection start={parentPos} end={pos} />}
                            </group>
                        );
                    })}
                </group>

                {/* Array Visualization */}
                <group position={[0, 0, 0]}>
                    <Text position={[-6, ARRAY_Y_POS + 1, 0]} fontSize={0.5} color={COLOR_HIGHLIGHT}>
                        Array View:
                    </Text>
                    {heap.map((val, i) => (
                        <ArrayItem
                            key={`arr-${i}`}
                            index={i}
                            value={val}
                            isHighlighted={highlightedIndices.includes(i)}
                        />
                    ))}
                </group>

            </Canvas>

            {/* Bottom Dock */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                {/* Left */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">MAX HEAP</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{message}</div>
                </div>

                {/* Center */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            placeholder="Val"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                        />
                        <button
                            onClick={handleInsert}
                            disabled={isAnimating}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Insert
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-800"></div>

                    <button
                        onClick={handleExtractMax}
                        disabled={isAnimating || heap.length === 0}
                        className="px-4 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/50 rounded hover:bg-purple-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Extract Max
                    </button>

                    <button
                        onClick={handleClear}
                        disabled={isAnimating}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Clear
                    </button>
                </div>

                {/* Right */}
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-slate-500">
                        {heap.length > 0 ? (heap[0] === Math.max(...heap) ? "Valid Heap" : "Invalid") : "Empty"}
                    </div>
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
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Code Window */}
            {showCode && (
                <div className="absolute top-20 right-5 z-20 pointer-events-auto">
                    <CodeWindow
                        code={codeSnippet}
                        highlightedLine={highlightedLine}
                        title={codeTitle}
                        onClose={() => setShowCode(false)}
                    />
                </div>
            )}

            {/* Info Modal */}
            {showInfo && (
                <InfoModal
                    type="HEAP"
                    onClose={() => setShowInfo(false)}
                />
            )}
        </div>
    );
};
