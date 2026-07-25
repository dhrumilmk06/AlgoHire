import { useState, useRef, useEffect } from 'react';
import { OrbitControls, Box, Edges } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import { CodeWindow } from '../ui/CodeWindow';
import { InfoModal } from '../InfoModal';
import { Info } from 'lucide-react';
import { BFS_CODE } from '../../constants/codeSnippets';

// --- Constants ---
const GRID_SIZE = 15;
const CELL_SIZE = 1.0;
const CELL_SPACING = 1.1; // Slightly larger for gap
const CAMERA_POS: [number, number, number] = [0, 20, 10];

// Colors
const COLOR_START = '#0DF205';   // Neon Green
const COLOR_END = '#FF0000';     // Neon Red
const COLOR_WALL = '#FFFFFF';    // White/Grey
const COLOR_VISITED = '#00FFFF'; // Cyan
const COLOR_PATH = '#FFC800';    // Bright Yellow
const COLOR_EMPTY = '#1e293b';   // Dark Slate

// Types
type NodeType = 'empty' | 'wall' | 'start' | 'end' | 'visited' | 'path';

interface NodeData {
    x: number;
    y: number;
    type: NodeType;
}

// --- Components ---

const GridNode = ({ node, activeTool, onClick }: { node: NodeData, activeTool: 'WALL' | 'START' | 'END', onClick: (x: number, y: number) => void }) => {
    const [hovered, setHovered] = useState(false);

    // Calculate Position: Centered
    const xPos = (node.x - GRID_SIZE / 2) * CELL_SPACING + (CELL_SPACING / 2);
    const zPos = (node.y - GRID_SIZE / 2) * CELL_SPACING + (CELL_SPACING / 2);

    // Color Logic
    const getColor = (type: NodeType) => {
        switch (type) {
            case 'start': return COLOR_START;
            case 'end': return COLOR_END;
            case 'wall': return COLOR_WALL;
            case 'visited': return COLOR_VISITED;
            case 'path': return COLOR_PATH;
            case 'empty': default: return COLOR_EMPTY;
        }
    };

    let targetColor = getColor(node.type);

    // Ghost Logic
    if (hovered && node.type === 'empty') {
        if (activeTool === 'WALL') targetColor = '#555555'; // Ghost Wall
        if (activeTool === 'START') targetColor = '#0DF205'; // Ghost Start
        if (activeTool === 'END') targetColor = '#FF0000'; // Ghost End
    }

    // Spring for color transition and slight height pop
    const { color, scaleY, emissiveIntensity } = useSpring({
        color: targetColor,
        scaleY: node.type === 'wall' ? 1.5 : (node.type === 'path' || node.type === 'visited') ? 0.3 : 0.1,
        emissiveIntensity: (hovered && node.type === 'empty') ? 0.2 : 0.5, // Dimmer ghost
        config: config.wobbly
    });

    return (
        <animated.group position={[xPos, 0, zPos]}>
            {/* @ts-ignore */}
            <animated.mesh
                onClick={(e) => {
                    e.stopPropagation();
                    onClick(node.x, node.y);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                }}
                onPointerOut={() => {
                    setHovered(false);
                }}
                /* @ts-ignore */
                scale-y={scaleY}
            >
                <Box args={[CELL_SIZE, 1, CELL_SIZE]}>
                    <animated.meshStandardMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={emissiveIntensity}
                        roughness={0.2}
                        metalness={0.5}
                    />
                    <Edges color="#222" threshold={15} />
                </Box>
            </animated.mesh>
        </animated.group>
    );
};

export const PathfindingLevel = ({ showGrid }: { showGrid: boolean }) => {
    // State
    const [grid, setGrid] = useState<NodeData[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [statusText, setStatusText] = useState("Select a tool to customize the map");
    const [activeTool, setActiveTool] = useState<'WALL' | 'START' | 'END'>('WALL');
    const [showCode, setShowCode] = useState(false);
    const [currentLine, setCurrentLine] = useState<number | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const cancelRef = useRef(false);

    // Initialization Helper
    const initGrid = () => {
        const newGrid: NodeData[] = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                let type: NodeType = 'empty';
                if (x === 0 && y === 0) type = 'start';
                if (x === GRID_SIZE - 1 && y === GRID_SIZE - 1) type = 'end';
                newGrid.push({ x, y, type });
            }
        }
        setGrid(newGrid);
        setStatusText("Ready");
        cancelRef.current = false;
        setIsRunning(false);
    };

    // Auto-init
    useEffect(() => {
        initGrid();
    }, []);

    // Interaction
    const handleNodeClick = (x: number, y: number) => {
        if (isRunning) return;

        setGrid(prev => {
            const newGrid = [...prev];
            const index = y * GRID_SIZE + x;
            const targetNode = newGrid[index];

            // Safety check
            if (!targetNode) return prev;

            // Logic based on Active Tool
            if (activeTool === 'WALL') {
                // Cannot overwrite Start or End
                if (targetNode.type === 'start' || targetNode.type === 'end') {
                    return prev;
                }
                // Toggle Wall <-> Empty
                if (targetNode.type === 'wall') {
                    newGrid[index] = { ...targetNode, type: 'empty' };
                } else {
                    // Can overwrite Visited/Path/Empty
                    newGrid[index] = { ...targetNode, type: 'wall' };
                }
            }
            else if (activeTool === 'START') {
                // Cannot place Start on End
                if (targetNode.type === 'end') return prev;

                // 1. Remove old Start
                const oldStartIndex = newGrid.findIndex(n => n.type === 'start');
                if (oldStartIndex !== -1) {
                    newGrid[oldStartIndex] = { ...newGrid[oldStartIndex], type: 'empty' };
                }

                // 2. Place new Start
                newGrid[index] = { ...targetNode, type: 'start' };
            }
            else if (activeTool === 'END') {
                // Cannot place End on Start
                if (targetNode.type === 'start') return prev;

                // 1. Remove old End
                const oldEndIndex = newGrid.findIndex(n => n.type === 'end');
                if (oldEndIndex !== -1) {
                    newGrid[oldEndIndex] = { ...newGrid[oldEndIndex], type: 'empty' };
                }

                // 2. Place new End
                newGrid[index] = { ...targetNode, type: 'end' };
            }

            return newGrid;
        });
    };

    // Utils
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const getIndex = (x: number, y: number) => y * GRID_SIZE + x;

    // BFS Algorithm
    const runBFS = async () => {
        if (isRunning) return;

        // Find Start and End
        const startNode = grid.find(n => n.type === 'start');
        const endNode = grid.find(n => n.type === 'end');

        if (!startNode || !endNode) {
            setStatusText("Error: Missing Start or End node!");
            return;
        }

        setIsRunning(true);
        cancelRef.current = false;
        setStatusText("Running BFS...");

        // Clear previous path/visited but keep walls
        setGrid(prev => prev.map(node => {
            if (node.type === 'visited' || node.type === 'path') return { ...node, type: 'empty' };
            return node;
        }));
        await delay(100);

        const queue: [number, number][] = [[startNode.x, startNode.y]];
        const visited = new Set<string>();
        const parentMap = new Map<string, string>(); // childKey -> parentKey
        const startKey = `${startNode.x},${startNode.y}`;
        const endKey = `${endNode.x},${endNode.y}`;

        visited.add(startKey);

        let found = false;

        while (queue.length > 0) {
            setCurrentLine(6); // While Loop (Line 6)
            if (cancelRef.current) return;

            const [cx, cy] = queue.shift()!;
            setCurrentLine(7); // Shift Node (Line 7)
            const currentKey = `${cx},${cy}`;

            // Check if end
            if (currentKey === endKey) {
                setCurrentLine(10); // Goal Check (Line 10)
                found = true;
                break;
            }

            // Visualize Visited (skip start)
            if (currentKey !== startKey) {
                setGrid(prev => {
                    const next = [...prev];
                    const idx = getIndex(cx, cy);
                    if (next[idx].type !== 'start' && next[idx].type !== 'end') {
                        next[idx] = { ...next[idx], type: 'visited' };
                    }
                    return next;
                });
                await delay(20);
            }

            // Neighbors
            const neighbors = [
                { x: cx, y: cy - 1 }, // Up
                { x: cx, y: cy + 1 }, // Down
                { x: cx - 1, y: cy }, // Left
                { x: cx + 1, y: cy }  // Right
            ];

            for (const n of neighbors) {
                setCurrentLine(15); // For Neighbors (Line 15)
                if (
                    n.x >= 0 && n.x < GRID_SIZE &&
                    n.y >= 0 && n.y < GRID_SIZE
                ) {
                    const nKey = `${n.x},${n.y}`;
                    const nIdx = getIndex(n.x, n.y);
                    const isWall = grid[nIdx].type === 'wall';

                    if (!visited.has(nKey) && !isWall) {
                        setCurrentLine(16); // Check Valid (Line 16)
                        visited.add(nKey);
                        parentMap.set(nKey, currentKey);
                        queue.push([n.x, n.y]);
                        setCurrentLine(18); // Push to Queue (Line 18)
                    }
                }
            }
            await delay(5); // Speed up slightly
        }

        if (found) {
            setCurrentLine(11); // Return Path (Line 11)
            setStatusText("Path Found! Reconstructing...");
            await reconstructPath(parentMap, endNode.x, endNode.y, startNode.x, startNode.y);
        } else {
            setStatusText("No Path Found!");
            setIsRunning(false);
        }
    };

    const reconstructPath = async (parentMap: Map<string, string>, endX: number, endY: number, startX: number, startY: number) => {
        let curr = `${endX},${endY}`;
        const startKey = `${startX},${startY}`;
        const path: string[] = [];

        while (curr !== startKey) {
            path.push(curr);
            curr = parentMap.get(curr)!;
            if (!curr) break;
        }

        for (const key of path) {
            if (cancelRef.current) return;
            const [x, y] = key.split(',').map(Number);

            if (!(x === endX && y === endY) && !(x === startX && y === startY)) {
                setGrid(prev => {
                    const next = [...prev];
                    const idx = getIndex(x, y);
                    next[idx] = { ...next[idx], type: 'path' };
                    return next;
                });
                await delay(30);
            }
        }
        setStatusText("Pathfinding Complete!");
        setIsRunning(false);
    };

    // Controls
    const resetWalls = () => {
        if (isRunning) return;
        initGrid();
    };

    const clearPath = () => {
        if (isRunning) return;
        setGrid(prev => prev.map(node => {
            if (node.type === 'visited' || node.type === 'path') return { ...node, type: 'empty' };
            return node;
        }));
        setStatusText("Path Cleared");
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: CAMERA_POS, fov: 45 }}>
                <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} />
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 20, 10]} intensity={1} />
                {showGrid && <gridHelper args={[30, 30, '#004444', '#002222']} position={[0, -0.51, 0]} />}

                <group position={[0, -0.5, 0]}>
                    {grid.map((node) => (
                        <GridNode
                            key={`${node.x}-${node.y}`}
                            node={node}
                            activeTool={activeTool}
                            onClick={handleNodeClick}
                        />
                    ))}
                </group>
            </Canvas>

            {showCode && (
                <CodeWindow
                    code={BFS_CODE}
                    highlightedLine={currentLine}
                    title="BFS Algorithm"
                    onClose={() => setShowCode(false)}
                />
            )}

            {/* Info Modal - Using GRAPH type due to BFS nature */}
            {showInfo && (
                <InfoModal
                    type="GRAPH"
                    onClose={() => setShowInfo(false)}
                />
            )}

            {/* Bottom Dock */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto items-center">
                {/* Left */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">PATHFINDING</h1>

                    </div>


                    <div className="text-xs text-slate-400 mt-1 font-mono">{statusText}</div>
                </div>

                {/* Center - Tools */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mr-2">Tools</span>

                    <button
                        onClick={() => setActiveTool('START')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${activeTool === 'START' ? 'bg-[#0DF205]/20 border-[#0DF205] text-[#0DF205] shadow-[0_0_10px_rgba(13,242,5,0.3)]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <div className="w-3 h-3 bg-[#0DF205] rounded-sm"></div>
                        <span className="text-xs font-bold">Start</span>
                    </button>

                    <button
                        onClick={() => setActiveTool('END')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${activeTool === 'END' ? 'bg-[#FF0000]/20 border-[#FF0000] text-[#FF0000] shadow-[0_0_10px_rgba(255,0,0,0.3)]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <div className="w-3 h-3 bg-[#FF0000] rounded-sm"></div>
                        <span className="text-xs font-bold">End</span>
                    </button>

                    <button
                        onClick={() => setActiveTool('WALL')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${activeTool === 'WALL' ? 'bg-white/20 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                    >
                        <div className="w-3 h-3 bg-white rounded-sm"></div>
                        <span className="text-xs font-bold">Wall</span>
                    </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={clearPath}
                        disabled={isRunning}
                        className="px-3 py-1.5 bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 rounded hover:bg-yellow-600/40 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Clear Path
                    </button>

                    <button
                        onClick={resetWalls}
                        disabled={isRunning}
                        className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Reset All
                    </button>

                    <div className="w-px h-8 bg-slate-800 mx-2"></div>

                    <button
                        onClick={runBFS}
                        disabled={isRunning}
                        className="px-6 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded hover:bg-green-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                    >
                        RUN BFS
                    </button>

                    <div className="w-px h-8 bg-slate-800 mx-2"></div>

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
        </div>
    );
};
