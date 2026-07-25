import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Text } from '@react-three/drei';
import CameraControls from './3d/CameraControls';
import { Play, Pause, RotateCcw, FastForward, Code as CodeIcon, Shuffle } from 'lucide-react';
import { NavigationControls } from './ui/NavigationControls';

// --- Types ---
type TraceEvent =
    | { type: 'READ'; index: number; value: number; timestamp: number }
    | { type: 'WRITE'; index: number; value: number; timestamp: number }
    | { type: 'SORTED'; index: number; timestamp: number };

type VisualState = {
    values: number[];
    highlights: { index: number; color: string }[];
    sortedIndices: Set<number>;
};

// --- Constants ---
const DEFAULT_CODE = `// Available: 'nums' or 'arr' (Array of 10 numbers)
// helper: markSorted(index) -> Turns bar green
// Sort it, shuffle it, or mess it up!

for (let i = 0; i < arr.length; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    // Compare
    if (arr[j] > arr[j + 1]) {
      // Swap
      let temp = arr[j];
      arr[j] = arr[j + 1];
      arr[j + 1] = temp;
    }
  }
  // Mark last element as sorted
  markSorted(arr.length - i - 1);
}
markSorted(0);`;

const ALGO_PRESETS: Record<string, string> = {
    'Bubble Sort': `// Bubble Sort
for (let i = 0; i < nums.length; i++) {
  for (let j = 0; j < nums.length - i - 1; j++) {
    // Compare
    if (nums[j] > nums[j + 1]) {
      // Swap
      let temp = nums[j];
      nums[j] = nums[j + 1];
      nums[j + 1] = temp;
    }
  }
  markSorted(nums.length - i - 1);
}
markSorted(0);`,
    'Selection Sort': `// Selection Sort
for (let i = 0; i < nums.length; i++) {
  let minIdx = i;
  for (let j = i + 1; j < nums.length; j++) {
    if (nums[j] < nums[minIdx]) {
      minIdx = j;
    }
  }
  if (minIdx !== i) {
    let temp = nums[i];
    nums[i] = nums[minIdx];
    nums[minIdx] = temp;
  }
  markSorted(i);
}
// Mark remaining
for(let k=0; k<nums.length; k++) markSorted(k);`,
    'Insertion Sort': `// Insertion Sort
for (let i = 1; i < nums.length; i++) {
  let key = nums[i];
  let j = i - 1;
  while (j >= 0 && nums[j] > key) {
    nums[j + 1] = nums[j];
    j = j - 1;
  }
  nums[j + 1] = key;
}
for(let k=0; k<nums.length; k++) markSorted(k);`,
    'Quick Sort': `// Quick Sort
function partition(arr, low, high) {
  let pivot = arr[high];
  let i = (low - 1);
  for (let j = low; j <= high - 1; j++) {
    if (arr[j] < pivot) {
      i++;
      let temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
  }
  let temp = arr[i + 1];
  arr[i + 1] = arr[high];
  arr[high] = temp;
  markSorted(i + 1);
  return i + 1;
}

function quickSort(arr, low, high) {
  if (low < high) {
    let pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  } else if (low === high) {
     markSorted(low);
  }
}

quickSort(nums, 0, nums.length - 1);`,
    'Gnome Sort': `// Gnome Sort
let index = 0;
while (index < nums.length) {
  if (index === 0) index++;
  if (nums[index] >= nums[index - 1])
    index++;
  else {
    let temp = nums[index];
    nums[index] = nums[index - 1];
    nums[index - 1] = temp;
    index--;
  }
}
for(let i=0; i<nums.length; i++) markSorted(i);`
};

const INITIAL_ARRAY_CONST = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];

// --- Helper: Spy Engine ---
const createSpyArray = (initialData: number[], onEvent: (e: TraceEvent) => void) => {
    return new Proxy(initialData, {
        get(target, prop, receiver) {
            const index = Number(prop);
            // Array access is numeric
            if (!isNaN(index)) {
                onEvent({
                    type: 'READ',
                    index,
                    value: target[index],
                    timestamp: Date.now()
                });
            }
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            const index = Number(prop);
            if (!isNaN(index)) {
                onEvent({
                    type: 'WRITE',
                    index,
                    value: Number(value),
                    timestamp: Date.now()
                });
            }
            return Reflect.set(target, prop, value, receiver);
        }
    });
};

// --- Random Data Generator ---
const generateRandomData = (size = 10) => {
    return Array.from({ length: size }, () => Math.floor(Math.random() * 20) + 1);
};

// --- 3D Components ---

const SandboxBar = ({
    value,
    index,
    highlightColor
}: {
    value: number;
    index: number;
    highlightColor?: string;
}) => {
    // Height scalar
    const height = value * 0.5;
    const color = highlightColor || '#06b6d4'; // Cyan default

    return (
        <group position={[index * 1.2 - 5.5, height / 2, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, height, 0.8]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.2}
                    metalness={0.8}
                    emissive={color}
                    emissiveIntensity={highlightColor ? 0.6 : 0.2}
                />
            </mesh>
            <Text
                position={[0, height / 2 + 0.5, 0]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
        </group>
    );
};

const SandboxScene = ({ vizState, showGrid }: { vizState: VisualState; showGrid: boolean }) => {
    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <CameraControls
                minPolarAngle={Math.PI / 4}
                maxPolarAngle={Math.PI / 1.5}
            />
            <Environment preset="city" />

            {/* Grid Helper with matching theme */}
            {showGrid && <gridHelper args={[20, 20, 0x333333, 0x111111]} position={[0, -2, 0]} />}

            <group position={[0, -1, 0]}>
                {vizState.values.map((val, idx) => {
                    // Find if this index is highlighted
                    const highlight = vizState.highlights.find(h => h.index === idx);
                    const isSorted = vizState.sortedIndices.has(idx);

                    // Priority: Active Highlight (Read/Write) > Sorted Status > Default
                    let color = undefined;
                    if (highlight) color = highlight.color;
                    else if (isSorted) color = '#22c55e'; // Green

                    return (
                        <SandboxBar
                            key={`bar-${idx}`}
                            value={val}
                            index={idx}
                            highlightColor={color}
                        />
                    );
                })}
            </group>
        </>
    );
};

// --- Main Component ---

const SandboxLevel: React.FC = () => {
    const [userCode, setUserCode] = useState(DEFAULT_CODE);
    const [trace, setTrace] = useState<TraceEvent[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Playback State
    // frameIndex represents the index in the trace log we have processed up to.
    const [frameIndex, setFrameIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Animation Refs
    const requestRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);

    const [startData, setStartData] = useState<number[]>(INITIAL_ARRAY_CONST);
    const [showGrid, setShowGrid] = useState(true);

    // --- Resizable Logic ---
    const [sidebarWidth, setSidebarWidth] = useState(500);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = React.useCallback(() => setIsResizing(true), []);
    const stopResizing = React.useCallback(() => setIsResizing(false), []);

    const resize = React.useCallback(
        (mouseMoveEvent: MouseEvent) => {
            if (isResizing) {
                const newWidth = mouseMoveEvent.clientX - 80; // Subtract padding-left (pl-20 = 80px)
                if (newWidth >= 300 && newWidth <= window.innerWidth * 0.8) {
                    setSidebarWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [resize, stopResizing]);

    const handleShuffle = () => {
        setIsPlaying(false);
        setFrameIndex(0);
        setTrace([]);
        setStartData(generateRandomData());
    };

    // --- Execution Logic ---
    const runCode = () => {
        setIsPlaying(false);
        setFrameIndex(0);
        setError(null);

        const newTrace: TraceEvent[] = [];
        const initialData = [...startData]; // Clone current state

        // 1. Create Helper (Spy)
        const spyArray = createSpyArray(initialData, (event) => {
            newTrace.push(event);
        });

        const markSorted = (index: number) => {
            newTrace.push({
                type: 'SORTED',
                index,
                timestamp: Date.now()
            });
        };

        // 2. Execute User Code
        try {
            // Unsafe Execution Wrapper
            // eslint-disable-next-line no-new-func
            const func = new Function('nums', 'arr', 'markSorted', userCode);
            func(spyArray, spyArray, markSorted);

            setTrace(newTrace);
            console.log("Trace generated:", newTrace.length, "events");

            if (newTrace.length > 0) {
                // Auto-play on success? Optional.
                // setIsPlaying(true); 
            }
        } catch (err: any) {
            setError(err.toString());
            console.error(err);
        }
    };

    // --- Playback Loop ---
    useEffect(() => {
        if (!isPlaying) {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const animate = (time: number) => {
            if (lastTimeRef.current === 0) lastTimeRef.current = time;
            const deltaTime = time - lastTimeRef.current;

            // Logic: Update frame based on speed. 
            // 5 frames per second base speed.
            if (deltaTime > (1000 / (5 * playbackSpeed))) {
                setFrameIndex(prev => {
                    if (prev >= trace.length) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
                lastTimeRef.current = time;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, playbackSpeed, trace.length]);


    // --- Visual State Computation ---
    const currentVisualState = useMemo<VisualState>(() => {
        const values = [...startData];
        let highlights: { index: number; color: string }[] = [];
        const sortedIndices = new Set<number>();

        // Replay history up to current frame
        for (let i = 0; i < frameIndex && i < trace.length; i++) {
            const event = trace[i];
            if (event.type === 'WRITE') {
                values[event.index] = event.value;
            } else if (event.type === 'SORTED') {
                sortedIndices.add(event.index);
            }
        }

        // Determine highlights for the *active* operation (the most recent one processed)
        // If the current event is SORTED, we technically don't need a temp highlight because the set updates immediately.
        const activeEventIndex = frameIndex - 1;
        if (activeEventIndex >= 0 && activeEventIndex < trace.length) {
            const currentEvent = trace[activeEventIndex];

            if (currentEvent.type === 'READ') {
                highlights.push({ index: currentEvent.index, color: '#fbbf24' }); // YELLOW (Read)
            } else if (currentEvent.type === 'WRITE') {
                highlights.push({ index: currentEvent.index, color: '#ef4444' }); // RED (Write)
            }
        }

        return { values, highlights, sortedIndices };
    }, [frameIndex, trace]);

    // --- Render ---

    return (
        <div className={`flex h-screen w-full pl-20 transition-all duration-300 ease-in-out bg-[#0a0a0a] text-cyan-50 font-sans overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>

            {/* Left Panel: Editor */}
            <div
                style={{ width: sidebarWidth }}
                className="flex flex-col border-r border-cyan-900/30 bg-[#0f1115] shrink-0"
            >
                {/* Header */}
                <div className="h-12 border-b border-cyan-900/30 flex items-center px-4 justify-between bg-black/20 gap-4">
                    <div className="flex items-center gap-2 text-cyan-400 shrink-0">
                        <CodeIcon size={18} />
                        <span className="font-bold tracking-wider text-sm">JS SANDBOX</span>
                    </div>

                    <div className="flex-1 flex items-center justify-end gap-2">
                        <select
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val && ALGO_PRESETS[val]) {
                                    setUserCode(ALGO_PRESETS[val]);
                                    // Reset select to default so user can re-select same if needed, or keep it. 
                                    // Actually better to leave it to show current? No, because editing code makes it custom.
                                    // Let's just reset value if we want 'Load Algorithm...' to always be visible.
                                    e.target.value = "";
                                }
                            }}
                            className="bg-slate-800 text-cyan-400 border border-slate-700 text-xs rounded px-2 py-1 focus:outline-none focus:border-cyan-500"
                            defaultValue=""
                        >
                            <option value="" disabled>Load Algorithm...</option>
                            {Object.keys(ALGO_PRESETS).map(key => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>

                        <button
                            onClick={() => setUserCode(DEFAULT_CODE)}
                            className="text-cyan-600 hover:text-cyan-400 p-1 transition-colors"
                            title="Reset to Default"
                        >
                            <RotateCcw size={14} />
                        </button>

                        <button
                            onClick={handleShuffle}
                            className="text-cyan-600 hover:text-cyan-400 p-1 transition-colors"
                            title="Shuffle Data"
                        >
                            <Shuffle size={14} />
                        </button>

                        <button
                            onClick={runCode}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(8,145,178,0.4)]"
                        >
                            <Play size={12} fill="currentColor" /> Run Code
                        </button>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 relative">
                    <textarea
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        className="w-full h-full bg-transparent p-4 font-mono text-sm text-cyan-100 focus:outline-none resize-none selection:bg-cyan-500/30"
                        spellCheck={false}
                    />
                    {error && (
                        <div className="absolute bottom-0 left-0 w-full bg-red-900/90 text-red-100 p-2 text-xs font-mono border-t border-red-500">
                            ERROR: {error}
                        </div>
                    )}
                </div>
            </div>


            {/* Draggable Handle */}
            <div
                className="w-1 cursor-col-resize bg-slate-800 hover:bg-cyan-500 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={startResizing}
            >
                {/* Visual Grip Indicator */}
                <div className="h-8 w-0.5 bg-slate-600 group-hover:bg-cyan-200 rounded-full" />
            </div>

            {/* Right Panel: Visualization */}
            <div className="flex-1 flex flex-col relative min-w-0">
                {/* 3D Viewport */}
                <div className="flex-1 bg-gradient-to-b from-[#0a0a0a] to-[#111]">
                    <Canvas shadows camera={{ position: [7, 8, 15], fov: 45 }}>
                        <CameraControls minDistance={5} maxDistance={20} />
                        <SandboxScene vizState={currentVisualState} showGrid={showGrid} />
                    </Canvas>
                </div>

                {/* Navigation Controls */}
                <div className="absolute bottom-20 right-8 z-[60]">
                    <NavigationControls showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)} />
                </div>

                {/* Playback Controls (Bottom Overlay) */}
                <div className="h-16 bg-[#0f1115] border-t border-cyan-900/30 flex items-center px-4 gap-4 z-[60]">
                    {/* Play/Pause */}
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={trace.length === 0}
                        className="text-cyan-400 hover:text-cyan-200 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>

                    {/* Reset */}
                    <button
                        onClick={() => { setIsPlaying(false); setFrameIndex(0); }}
                        className="text-cyan-400 hover:text-cyan-200"
                    >
                        <RotateCcw size={18} />
                    </button>

                    {/* Scrubber */}
                    <div className="flex-1 flex flex-col justify-center">
                        <input
                            type="range"
                            min={0}
                            max={trace.length}
                            value={frameIndex}
                            onChange={(e) => {
                                setIsPlaying(false);
                                setFrameIndex(Number(e.target.value));
                            }}
                            className="w-full h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-cyan-400"
                        />
                        <div className="flex justify-between text-[10px] text-cyan-600 mt-1 font-mono">
                            <span>0</span>
                            <span>Frame: {frameIndex} / {trace.length}</span>
                        </div>
                    </div>

                    {/* Speed */}
                    <div className="w-24 flex flex-col">
                        <div className="flex items-center gap-1 text-[10px] text-cyan-400 mb-1">
                            <FastForward size={10} />
                            <span>Speed: {playbackSpeed}x</span>
                        </div>
                        <input
                            type="range"
                            min={0.5}
                            max={5}
                            step={0.5}
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                            className="w-full h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                </div>

                {/* Trace Count Banner (Top Right Overlay) */}
                <div className="absolute top-4 right-4 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur border border-cyan-500/20 px-3 py-1 rounded text-xs text-cyan-400 font-mono">
                        Events Recorded: {trace.length}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SandboxLevel;
