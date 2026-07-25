import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import CameraControls from '../3d/CameraControls';
import * as THREE from 'three';
import { InfoModal } from '../InfoModal';
import { CodeWindow } from '../ui/CodeWindow';
import { Info } from 'lucide-react';

// --- Types ---
type SearchBarProps = {
    value: number;
    index: number;
    state: 'default' | 'active' | 'found' | 'sorted';
    isTarget: boolean;
};

// --- 3D Bar Component ---
const SearchBar = ({ value, index, state, isTarget }: SearchBarProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const targetHeight = Math.max(1, value * 0.5); // Scale height

    useFrame((_, delta) => {
        if (meshRef.current) {
            // Smoothly animate height
            meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetHeight, delta * 5);
            // Smoothly animate position based on height
            meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetHeight / 2, delta * 5);
        }
    });

    let color = '#334155'; // Slate-700 (Default)
    if (state === 'active') color = '#fbbf24'; // Amber-400 (Active/Checking)
    if (state === 'found') color = '#22c55e'; // Green-500 (Found)
    if (state === 'sorted') color = '#3b82f6'; // Blue-500 (Sorted indication)

    return (
        <group position={[index * 1.5 - 10, 0, 0]}>
            <mesh ref={meshRef} position={[0, 0.5, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} />
            </mesh>
            {/* Value Label */}
            <Text
                position={[0, targetHeight + 0.5, 0]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
            {/* Index Label */}
            <Text
                position={[0, -0.8, 0]}
                fontSize={0.3}
                color="#94a3b8" // Slate-400
            >
                {index}
            </Text>
            {/* Target Marker */}
            {isTarget && (
                <Text
                    position={[0, -1.5, 0]}
                    fontSize={0.3}
                    color="#f472b6" // Pink-400
                >
                    TARGET
                </Text>
            )}
        </group>
    );
};

// --- Main Component ---
const SearchLevel = () => {
    // Data State
    const [data, setData] = useState<number[]>([10, 45, 2, 8, 15, 99, 23, 7, 50, 30]);
    const [inputData, setInputData] = useState('10, 45, 2, 8, 15, 99, 23, 7, 50, 30');
    const [targetStr, setTargetStr] = useState('15');
    const [target, setTarget] = useState(15);

    // Animation State
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [foundIndex, setFoundIndex] = useState<number | null>(null);
    const [checkingIndices, setCheckingIndices] = useState<number[]>([]); // For Binary Search implementation visualization
    const [isSearching, setIsSearching] = useState(false);
    const [statusMsg, setStatusMsg] = useState('Ready to Search');

    // UI State
    const [showCode, setShowCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [codeSnippet, setCodeSnippet] = useState('');
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
    const [algorithm, setAlgorithm] = useState<'Linear' | 'Binary' | null>(null);

    // Parse Input
    const handleUpdateData = () => {
        if (isSearching) return;
        const arr = inputData.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        if (arr.length > 0) {
            // Limit size for performance/layout
            const limitedArr = arr.slice(0, 20);
            setData(limitedArr);
            setStatusMsg(`Updated data with ${limitedArr.length} items`);
            setFoundIndex(null);
            setActiveIndex(null);
            setCheckingIndices([]);
        }
    };

    const handleUpdateTarget = () => {
        if (isSearching) return;
        const num = parseInt(targetStr);
        if (!isNaN(num)) {
            setTarget(num);
            setStatusMsg(`Target set to ${num}`);
            setFoundIndex(null);
            setActiveIndex(null);
            setCheckingIndices([]);
        }
    };

    // --- Algorithms ---

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runLinearSearch = async () => {
        if (isSearching) return;
        setIsSearching(true);
        setAlgorithm('Linear');
        setStatusMsg('Starting Linear Search...');
        setFoundIndex(null);
        setActiveIndex(null);
        setCheckingIndices([]);
        // Code snippet with line numbers logic corresponding to execution
        setCodeSnippet(`function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`);
        setShowCode(true);

        for (let i = 0; i < data.length; i++) {
            setHighlightedLine(2);
            setActiveIndex(i);
            setStatusMsg(`Checking index ${i}: Value ${data[i]}`);
            await sleep(800);

            setHighlightedLine(3);
            if (data[i] === target) {
                setStatusMsg(`Found target ${target} at index ${i}!`);
                setFoundIndex(i);
                setActiveIndex(null);
                setIsSearching(false);
                setHighlightedLine(null);
                return;
            }
        }

        setHighlightedLine(5);
        setStatusMsg(`Target ${target} not found.`);
        setActiveIndex(null);
        setIsSearching(false);
        setHighlightedLine(null);
    };

    const runBinarySearch = async () => {
        if (isSearching) return;
        setIsSearching(true);
        setAlgorithm('Binary');
        setStatusMsg('Preparing Binary Search...');
        setFoundIndex(null);
        setActiveIndex(null);
        setCheckingIndices([]);
        setCodeSnippet(`function binarySearch(arr, target) {
  let l = 0, r = arr.length - 1;
  while (l <= r) {
    let m = Math.floor((l + r) / 2);
    if (arr[m] === target) return m;
    if (arr[m] < target) l = m + 1;
    else r = m - 1;
  }
  return -1;
}`);
        setShowCode(true);

        // Check if sorted
        const isSorted = data.every((v, i, a) => !i || a[i - 1] <= v);
        let workingData = [...data];

        if (!isSorted) {
            setStatusMsg('Data is not sorted. Sorting first...');
            await sleep(1000);
            workingData.sort((a, b) => a - b);
            setData([...workingData]); // Visualize Update
            await sleep(1000);
            setStatusMsg('Data sorted. Starting Binary Search...');
        }

        let left = 0;
        let right = workingData.length - 1;
        setHighlightedLine(2);

        while (left <= right) {
            setHighlightedLine(3);
            const mid = Math.floor((left + right) / 2);
            setHighlightedLine(4);

            // Visualize Range
            const rangeIndices = [];
            for (let i = left; i <= right; i++) rangeIndices.push(i);
            setCheckingIndices(rangeIndices);
            setActiveIndex(mid); // Highlight mid specifically

            setStatusMsg(`L: ${left}, R: ${right}, Mid: ${mid} (Val: ${workingData[mid]})`);
            await sleep(1500);

            setHighlightedLine(5);
            if (workingData[mid] === target) {
                setStatusMsg(`Found target ${target} at index ${mid}!`);
                setFoundIndex(mid);
                setActiveIndex(null);
                setCheckingIndices([]);
                setIsSearching(false);
                setHighlightedLine(null);
                return;
            }

            setHighlightedLine(6);
            if (workingData[mid] < target) {
                setStatusMsg(`${workingData[mid]} < ${target}. Ignoring left half.`);
                left = mid + 1;
            } else {
                setHighlightedLine(7);
                setStatusMsg(`${workingData[mid]} > ${target}. Ignoring right half.`);
                right = mid - 1;
            }
            await sleep(1000);
        }

        setHighlightedLine(9);
        setStatusMsg(`Target ${target} not found.`);
        setActiveIndex(null);
        setCheckingIndices([]);
        setIsSearching(false);
        setHighlightedLine(null);
    };


    return (
        <div className="flex flex-col h-screen w-full pl-20 bg-slate-950">
            {/* Main Content Area (Canvas) - Takes remaining top space */}
            <div className="flex-1 relative w-full overflow-hidden">
                <Canvas camera={{ position: [0, 2, 16], fov: 45 }}>
                    <CameraControls
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />

                    <group position={[-(data.length * 1.5) / 2 + 5, -2, 0]}>
                        {data.map((val, idx) => {
                            let state: 'default' | 'active' | 'found' | 'sorted' = 'default';
                            if (idx === foundIndex) state = 'found';
                            else if (idx === activeIndex) state = 'active';
                            else if (checkingIndices.includes(idx)) state = 'sorted';

                            return (
                                <SearchBar
                                    key={idx}
                                    value={val}
                                    index={idx}
                                    state={state}
                                    isTarget={val === target}
                                />
                            );
                        })}
                    </group>
                </Canvas>

                {/* Code Window */}
                {showCode && (
                    <div className="absolute top-5 right-5 z-20 pointer-events-auto">
                        <CodeWindow
                            code={codeSnippet}
                            highlightedLine={highlightedLine as number | null}
                            title={algorithm ? `${algorithm} Search` : 'Algorithm'}
                            onClose={() => setShowCode(false)}
                        />
                    </div>
                )}

                {/* Info Modal */}
                {showInfo && (
                    <InfoModal
                        type="ARRAY"
                        onClose={() => setShowInfo(false)}
                    />
                )}
            </div>

            {/* Bottom Footer Control Bar */}
            <div className="w-full bg-slate-950 border-t border-slate-800 px-8 py-6 flex items-center justify-between shrink-0 z-50">
                {/* Left Section: Title & Status */}
                <div className="flex flex-col justify-center min-w-[200px]">
                    <h1 className="text-2xl font-bold text-cyan-400 tracking-wider uppercase whitespace-nowrap">SEARCHING</h1>
                    <div className="text-slate-500 text-xs font-mono mt-0.5 tracking-wide whitespace-nowrap">{statusMsg}</div>
                </div>

                {/* Center Section: Controls Group */}
                <div className="flex items-center gap-6 flex-1 justify-center">
                    <input
                        type="text"
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded font-mono text-sm w-60 outline-none focus:border-cyan-500 transition-colors"
                        placeholder="e.g. 10, 20, 30..."
                    />

                    <button
                        onClick={() => { handleUpdateData(); handleUpdateTarget(); }}
                        disabled={isSearching}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded font-bold text-xs tracking-wider transition-colors disabled:opacity-50"
                    >
                        LOAD
                    </button>

                    <input
                        type="number"
                        value={targetStr}
                        onChange={(e) => setTargetStr(e.target.value)}
                        onBlur={handleUpdateTarget}
                        className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded font-mono text-sm w-20 outline-none focus:border-cyan-500 transition-colors"
                        placeholder="Target"
                    />
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={runLinearSearch}
                        disabled={isSearching}
                        className="px-6 py-3 bg-slate-800 text-cyan-400 border border-cyan-900/50 hover:bg-cyan-900/20 rounded font-bold tracking-wider transition-all disabled:opacity-50 text-sm"
                    >
                        LINEAR
                    </button>

                    <button
                        onClick={runBinarySearch}
                        disabled={isSearching}
                        className="px-6 py-3 bg-cyan-900/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/20 rounded font-bold tracking-wider transition-all disabled:opacity-50 text-sm"
                    >
                        BINARY
                    </button>

                    {/* Divider/Spacing for Icons */}
                    <div className="w-px h-10 bg-slate-800 mx-2"></div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowInfo(true)}
                            className="p-3 bg-slate-800 rounded-lg text-cyan-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                            title="Show Info"
                        >
                            <Info size={20} />
                        </button>

                        <button
                            onClick={() => setShowCode(!showCode)}
                            className={`p-3 rounded-lg transition-colors border ${showCode ? 'bg-cyan-900/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-cyan-400'}`}
                            title="Toggle Code Window"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchLevel;
