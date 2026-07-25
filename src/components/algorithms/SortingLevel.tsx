import { useState, useRef, useEffect } from 'react';
import { Text, Box, Edges } from '@react-three/drei';
import CameraControls from '../3d/CameraControls';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { CodeWindow } from '../ui/CodeWindow';
import { InfoModal } from '../InfoModal';
import { Info } from 'lucide-react';
import { BUBBLE_SORT_CODE, INSERTION_SORT_CODE, SELECTION_SORT_CODE, MERGE_SORT_CODE } from '../../constants/codeSnippets';

// --- Constants ---
const ARRAY_SIZE = 10;
const BAR_WIDTH = 1.0;
const BAR_SPACING = 2.0; // Spaced out more
const MAX_VAL = 100;
const CAMERA_POS: [number, number, number] = [0, 8, 20];

// Colors
const COLOR_IDLE = '#06b6d4';   // Cyan Emissive
const COLOR_COMPARE = '#facc15'; // Yellow Emissive
const COLOR_SWAP = '#ef4444';    // Red Emissive
const COLOR_SORTED = '#22c55e';  // Green Emissive
const COLOR_SELECTED = '#d946ef'; // Fuchsia Emissive (for pivot/min/key)

// Types
type SortState = 'idle' | 'compare' | 'swap' | 'sorted' | 'selected';
type AlgorithmType = 'Bubble' | 'Selection' | 'Insertion' | 'Merge';

interface SortItem {
    id: number;
    value: number;
    state: SortState;
}

// --- Components ---

const SortingBar = ({ item, index }: { item: SortItem, index: number }) => {
    // Calculate Position: Centered
    const xPos = index * BAR_SPACING - ((ARRAY_SIZE * BAR_SPACING) / 2) + (BAR_SPACING / 2);
    const height = item.value / 10; // Scale down for visuals

    // Spring Animations for Position and Color
    const { positionX, emissiveColor, scaleY } = useSpring({
        positionX: xPos,
        scaleY: height,
        emissiveColor:
            item.state === 'compare' ? COLOR_COMPARE :
                item.state === 'swap' ? COLOR_SWAP :
                    item.state === 'sorted' ? COLOR_SORTED :
                        item.state === 'selected' ? COLOR_SELECTED : COLOR_IDLE,
        config: config.wobbly // Nice bounce on swap
    });

    return (
        <animated.group position-x={positionX}>
            {/* The Pillar */}
            {/* @ts-ignore */}
            <animated.mesh position-y={scaleY.to(s => s / 2)}>
                {/* @ts-ignore */}
                <Box args={[BAR_WIDTH, 1, BAR_WIDTH]}>
                    {/* @ts-ignore */}
                    <animated.meshStandardMaterial
                        color="#000000"
                        emissive={emissiveColor}
                        emissiveIntensity={0.5}
                        roughness={0.1}
                        metalness={0.8}
                    />
                    <Edges color="white" threshold={15} />
                </Box>
                {/* @ts-ignore */}
                <animated.mesh scale-y={scaleY} />
            </animated.mesh>

            {/* Label floating above */}
            {/* @ts-ignore */}
            <animated.group position-y={scaleY.to(s => s + 0.5)}>
                {/* @ts-ignore */}
                <Text fontSize={0.5} color="white" anchorX="center" anchorY="bottom">
                    {item.value}
                </Text>
            </animated.group>
        </animated.group>
    );
};

export const SortingLevel = ({ showGrid }: { showGrid: boolean }) => {
    // State
    const [items, setItems] = useState<SortItem[]>([]);
    const [isSorting, setIsSorting] = useState(false);
    const [statusText, setStatusText] = useState("Ready to Sort");
    const [algorithm, setAlgorithm] = useState<AlgorithmType>('Bubble');
    const [showCode, setShowCode] = useState(false);
    const [currentLine, setCurrentLine] = useState<number | null>(null);
    const [showInfo, setShowInfo] = useState(false); // Default off for Sorting since it's busy

    // New State for Controls
    const [generatedSize, setGeneratedSize] = useState(10);
    const [customInput, setCustomInput] = useState('');

    // Refs for safe async access
    const cancelRef = useRef(false);

    // Code Snippet Logic
    const getActiveCode = () => {
        switch (algorithm) {
            case 'Bubble': return BUBBLE_SORT_CODE;
            case 'Selection': return SELECTION_SORT_CODE;
            case 'Insertion': return INSERTION_SORT_CODE;
            case 'Merge': return MERGE_SORT_CODE;
            default: return BUBBLE_SORT_CODE;
        }
    };

    // Initialization Helper
    const resetArray = (newItems: SortItem[]) => {
        setItems(newItems);
        setStatusText("Ready to Sort");
        cancelRef.current = false;
        setIsSorting(false);
    };

    const generateArray = () => {
        if (isSorting) return;
        const newItems: SortItem[] = Array.from({ length: generatedSize }, (_, i) => ({
            id: i,
            value: Math.floor(Math.random() * MAX_VAL) + 1,
            state: 'idle'
        }));
        resetArray(newItems);
        setStatusText("New Random Array Generated");
    };

    const handleLoadCustom = () => {
        if (isSorting) return;

        // Parse and Validate
        const values = customInput.split(',')
            .map(s => parseInt(s.trim()))
            .filter(n => !isNaN(n));

        if (values.length === 0) {
            setStatusText("Invalid Input");
            return;
        }

        // Constraints
        const validValues = values.slice(0, 20).map(v => Math.min(Math.max(v, 1), 100));

        const newItems: SortItem[] = validValues.map((val, i) => ({
            id: i,
            value: val,
            state: 'idle'
        }));

        resetArray(newItems);
        setGeneratedSize(newItems.length); // Sync slider
        setStatusText("Custom Array Loaded");
        setCustomInput('');
    };

    // Auto-generate on mount
    useEffect(() => {
        generateArray();
    }, []);

    // Delay Helper
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // --- Algorithms ---

    // Helper to bulk update states to reduce boilerplate
    const updateItemsState = (items: SortItem[], indices: number[], state: SortState, sortedStart: number = items.length): SortItem[] => {
        return items.map((item, idx) => {
            if (idx >= sortedStart) return { ...item, state: 'sorted' } as SortItem;
            if (indices.includes(idx)) return { ...item, state } as SortItem;
            return { ...item, state: 'idle' } as SortItem;
        });
    };

    const runBubbleSort = async (currentItems: SortItem[]) => {
        const n = currentItems.length;
        setStatusText("Starting Bubble Sort...");

        for (let i = 0; i < n - 1; i++) {
            setCurrentLine(2); // Outer Loop
            for (let j = 0; j < n - i - 1; j++) {
                setCurrentLine(3); // Inner Loop
                if (cancelRef.current) return;

                // Compare
                setStatusText(`Comparing ${j} vs ${j + 1}`);
                currentItems = updateItemsState(currentItems, [j, j + 1], 'compare', n - i);
                setItems([...currentItems]);
                setCurrentLine(5); // Comparison
                await delay(500);

                // Swap?
                if (currentItems[j].value > currentItems[j + 1].value) {
                    setStatusText("Swapping!");
                    setCurrentLine(7); // Swap
                    currentItems = updateItemsState(currentItems, [j, j + 1], 'swap', n - i);
                    setItems([...currentItems]);

                    const temp = currentItems[j];
                    currentItems[j] = currentItems[j + 1];
                    currentItems[j + 1] = temp;
                    setItems([...currentItems]);
                    await delay(500);
                }

                // Reset pair to idle
                currentItems = updateItemsState(currentItems, [], 'idle', n - i);
                setItems([...currentItems]);
            }
            // Mark sorted
            currentItems[n - 1 - i].state = 'sorted';
            setItems([...currentItems]);
        }
        currentItems[0].state = 'sorted';
        setItems([...currentItems]);
        setCurrentLine(null);
    };

    const runSelectionSort = async (currentItems: SortItem[]) => {
        const n = currentItems.length;
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;

            // Mark current start as selected
            currentItems[i].state = 'selected';
            setItems([...currentItems]);
            setStatusText(`Current Minimum: Index ${i}`);
            await delay(300);

            for (let j = i + 1; j < n; j++) {
                setCurrentLine(4); // Inner Loop
                if (cancelRef.current) return;

                setStatusText(`Scanning: Comparing ${j} with Min (${minIdx})`);
                setCurrentLine(5); // Comparison

                // Highlight Compare
                currentItems[j].state = 'compare';
                setItems([...currentItems]);
                await delay(300);

                if (currentItems[j].value < currentItems[minIdx].value) {
                    // Revert old min to idle if it wasn't i
                    if (minIdx !== i) currentItems[minIdx].state = 'idle';

                    minIdx = j;
                    setStatusText(`New Minimum Found: Index ${minIdx}`);
                    setCurrentLine(6); // New Min
                    currentItems[minIdx].state = 'selected'; // New Min
                    setItems([...currentItems]);
                    await delay(500);
                } else {
                    currentItems[j].state = 'idle';
                    setItems([...currentItems]);
                }
            }

            // Swap if needed
            if (minIdx !== i) {
                setCurrentLine(10); // Swap
                setStatusText(`Swapping ${i} with Min ${minIdx}`);
                currentItems[i].state = 'swap';
                currentItems[minIdx].state = 'swap';
                setItems([...currentItems]);
                await delay(500);

                const temp = currentItems[i];
                currentItems[i] = currentItems[minIdx];
                currentItems[minIdx] = temp;
                setItems([...currentItems]);
                await delay(500);
            }

            // Mark sorted
            currentItems[i].state = 'sorted';
            // Reset old min if needed
            if (minIdx !== i) currentItems[minIdx].state = 'idle';

            setItems([...currentItems]);
        }
        currentItems[n - 1].state = 'sorted';
        setItems([...currentItems]);
    };

    const runInsertionSort = async (currentItems: SortItem[]) => {
        const n = currentItems.length;

        // Mark first element as part of sorted portion (Purple)
        currentItems[0].state = 'selected';
        setItems([...currentItems]);
        await delay(300);

        for (let i = 1; i < n; i++) {
            setCurrentLine(2); // Outer Loop
            if (cancelRef.current) return;

            // Pick the active card (Green)
            const keyVal = currentItems[i].value;
            setStatusText(`Inserting Index ${i} (${keyVal})`);

            // Highlight active element (Green - re-using 'sorted' color for active)
            currentItems[i].state = 'sorted';
            setItems([...currentItems]);
            await delay(500);

            let j = i;

            // Bubbling down
            while (j > 0) {
                setCurrentLine(8); // While Check (Line 8 in snippet)
                if (cancelRef.current) return;

                // Compare with neighbor (Yellow)
                currentItems[j - 1].state = 'compare';
                setItems([...currentItems]);
                setStatusText(`Comparing ${currentItems[j].value} < ${currentItems[j - 1].value}`);
                await delay(300);

                if (currentItems[j].value < currentItems[j - 1].value) {
                    setCurrentLine(9); // Swap/Shift (Line 9 in snippet)
                    // Swap
                    currentItems[j].state = 'swap';
                    currentItems[j - 1].state = 'swap';
                    setItems([...currentItems]);
                    await delay(300);

                    const temp = currentItems[j];
                    currentItems[j] = currentItems[j - 1];
                    currentItems[j - 1] = temp;
                    setItems([...currentItems]);
                    await delay(300);

                    // Continue bubbling
                    currentItems[j].state = 'selected'; // Old position becomes sorted
                    currentItems[j - 1].state = 'sorted'; // New position is active
                    setItems([...currentItems]);

                    j--;
                } else {
                    // Neighbor was smaller/equal, stop.
                    currentItems[j - 1].state = 'selected'; // Reset neighbor to sorted color
                    setItems([...currentItems]);
                    break;
                }
            }

            // Finalize: Active element becomes part of sorted portion (Purple)
            currentItems[j].state = 'selected';
            setItems([...currentItems]);
        }

        currentItems.forEach(item => item.state = 'sorted');
        setItems([...currentItems]);
        setStatusText("Sorting Complete!");
        setCurrentLine(null);
    };

    const runMergeSort = async (currentItems: SortItem[]) => {
        const n = currentItems.length;

        const merge = async (arr: SortItem[], l: number, m: number, r: number) => {
            // Visualize: Highlight the working range
            for (let i = l; i <= r; i++) {
                arr[i].state = 'selected';
            }
            setItems([...arr]);
            await delay(300);

            // Standard Merge Sort Logic (using values)
            const n1 = m - l + 1;
            const n2 = r - m;
            const L = new Array(n1);
            const R = new Array(n2);

            for (let i = 0; i < n1; i++) L[i] = arr[l + i].value;
            for (let j = 0; j < n2; j++) R[j] = arr[m + 1 + j].value;

            let i = 0, j = 0, k = l;

            while (i < n1 && j < n2) {
                setCurrentLine(4); // Merge Loop
                if (cancelRef.current) return;

                // Visual: Highlight writing position
                arr[k].state = 'swap'; // Red for "Writing"
                setItems([...arr]);
                setCurrentLine(5); // Comparison / Write
                await delay(150); // Fast updates

                if (L[i] <= R[j]) {
                    arr[k].value = L[i];
                    i++;
                } else {
                    arr[k].value = R[j];
                    j++;
                }

                setItems([...arr]); // Show value update
                await delay(150);

                // Back to selected (still in range)
                arr[k].state = 'selected';
                k++;
            }

            while (i < n1) {
                if (cancelRef.current) return;
                arr[k].state = 'swap';
                setItems([...arr]);
                await delay(150);

                arr[k].value = L[i];
                setItems([...arr]);
                await delay(150);

                arr[k].state = 'selected';
                i++;
                k++;
            }

            while (j < n2) {
                if (cancelRef.current) return;
                arr[k].state = 'swap';
                setItems([...arr]);
                await delay(150);

                arr[k].value = R[j];
                setItems([...arr]);
                await delay(150);

                arr[k].state = 'selected';
                j++;
                k++;
            }

            // Reset range to idle (done with this chunk)
            for (let x = l; x <= r; x++) {
                arr[x].state = 'idle';
            }
            setItems([...arr]);
            await delay(200);
        };

        const sort = async (arr: SortItem[], l: number, r: number) => {
            setCurrentLine(18); // Recursive Call / Base Check
            if (l >= r) return;
            if (cancelRef.current) return;

            const m = l + Math.floor((r - l) / 2);
            await sort(arr, l, m);
            await sort(arr, m + 1, r);

            setCurrentLine(22); // Merge Call
            setStatusText(`Merging Index ${l}-${m} and ${m + 1}-${r}`);
            await merge(arr, l, m, r);
        };

        await sort(currentItems, 0, n - 1);

        // Finalize: All sorted
        currentItems.forEach(item => item.state = 'sorted');
        setItems([...currentItems]);
        setCurrentLine(null);
    };

    const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (isSorting) return;
        setAlgorithm(e.target.value as AlgorithmType);
        generateArray();
    };

    const startSort = async () => {
        if (isSorting) return;
        setIsSorting(true);
        cancelRef.current = false;

        const currentItems = JSON.parse(JSON.stringify(items));

        if (algorithm === 'Bubble') await runBubbleSort(currentItems);
        else if (algorithm === 'Selection') await runSelectionSort(currentItems);
        else if (algorithm === 'Insertion') await runInsertionSort(currentItems);
        else if (algorithm === 'Merge') await runMergeSort(currentItems);

        setStatusText("Sorting Complete!");
        setIsSorting(false);
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: CAMERA_POS, fov: 45 }}>
                <CameraControls maxPolarAngle={Math.PI / 2} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1} />
                {showGrid && <gridHelper args={[60, 60, '#004444', '#002222']} position={[0, -0.01, 0]} />}

                <group position={[0, 0, 0]}>
                    {items.map((item, index) => (
                        <SortingBar
                            key={item.id}
                            item={item}
                            index={index}
                        />
                    ))}
                </group>
            </Canvas>

            {showCode && (
                <CodeWindow
                    code={getActiveCode()}
                    highlightedLine={currentLine}
                    title={`${algorithm} Sort`}
                    onClose={() => setShowCode(false)}
                />
            )}

            {/* Bottom Dock */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                {/* Left */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">SORTING</h1>

                    {/* Algorithm Selector */}
                    <div className="pointer-events-auto flex items-center gap-2">
                        <select
                            value={algorithm}
                            onChange={handleAlgorithmChange}
                            disabled={isSorting}
                            className="bg-slate-900 text-cyan-500 text-xs border border-cyan-900/50 rounded p-1 outline-none focus:border-cyan-500 uppercase font-bold tracking-wider cursor-pointer"
                        >
                            <option value="Bubble">Bubble Sort</option>
                            <option value="Selection">Selection Sort</option>
                            <option value="Insertion">Insertion Sort</option>
                            <option value="Merge">Merge Sort</option>
                        </select>


                    </div>



                    <div className="text-xs text-slate-400 mt-1 font-mono">{statusText}</div>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-6">
                    {/* Randomize Group */}
                    <div className="flex items-center gap-2 bg-slate-900/50 p-1 pr-3 rounded-lg border border-slate-800">
                        <button
                            onClick={generateArray}
                            disabled={isSorting}
                            className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Randomize
                        </button>
                        <div className="flex flex-col w-16">
                            <span className="text-[9px] text-slate-500 font-mono text-center mb-0.5">Size: {generatedSize}</span>
                            <input
                                type="range"
                                min="5"
                                max="20"
                                step="1"
                                value={generatedSize}
                                onChange={(e) => setGeneratedSize(parseInt(e.target.value))}
                                disabled={isSorting}
                                className="h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Custom Input Group */}
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="e.g. 50, 10, 99, 2"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            disabled={isSorting}
                            className="w-32 bg-slate-900 text-xs text-white p-2 rounded border border-cyan-900/50 outline-none focus:border-cyan-500 transition-colors font-mono placeholder:text-slate-600"
                        />
                        <button
                            onClick={handleLoadCustom}
                            disabled={isSorting}
                            className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-600/40 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Load
                        </button>
                    </div>

                    <div className="w-px h-8 bg-slate-800"></div>

                    <button
                        onClick={startSort}
                        disabled={isSorting}
                        className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded hover:bg-green-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                    >
                        Sort
                    </button>
                </div>

                {/* Right Status */}
                <div className="flex items-center gap-4">
                    <div className="w-32 text-right flex flex-col justify-center mr-2">
                        <div className="text-[10px] text-slate-500 font-mono uppercase">
                            {isSorting ? "Sorting..." : "Idle"}
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">
                            Count: {items.length}
                        </div>
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
                        title="Toggle Code Window"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                </div>
            </div>


            {/* Info Modal */}
            {
                showInfo && (
                    <InfoModal
                        type="ARRAY"
                        onClose={() => setShowInfo(false)}
                    />
                )
            }
        </div >
    );
};
