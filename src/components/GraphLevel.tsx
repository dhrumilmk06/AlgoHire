import React, { useState, useEffect, Suspense } from 'react';
import { Text, Box, Edges, Line } from '@react-three/drei';
import CameraControls from './3d/CameraControls';
import { useSpring, animated } from '@react-spring/three';
import { Canvas } from '@react-three/fiber';
import { CodeWindow } from './ui/CodeWindow';
import { InfoModal } from './InfoModal';
import { Info } from 'lucide-react';

// --- Constants ---
const NODE_SIZE = 0.8;
const CIRCLE_RADIUS = 6;
const COLOR_NODE = '#0a192f'; // Dark Navy
const COLOR_EDGE_DEFAULT = '#00ffff'; // Cyan
const COLOR_ACTIVE = '#ffff00'; // Yellow (BFS visited)
const COLOR_PROCESSING = '#ff00ff'; // Magenta (Currently visiting)

const BFS_CODE = [
    "void bfs(int start) {",
    "    queue.push(start);",
    "    visited[start] = true;",
    "    while (!queue.empty()) {",
    "        int u = queue.front();",
    "        queue.pop();",
    "        for (int v : adj[u]) {",
    "            if (!visited[v]) {",
    "                visited[v] = true;",
    "                queue.push(v);",
    "            }",
    "        }",
    "    }",
    "}"
].join('\n');

// --- Types ---
interface GraphNode {
    id: number;
    position: [number, number, number];
}

// --- Helpers ---
const getCircularPosition = (index: number, total: number): [number, number, number] => {
    if (total === 0) return [0, 0, 0];
    const angle = (index / total) * Math.PI * 2;
    return [
        Math.cos(angle) * CIRCLE_RADIUS,
        0,
        Math.sin(angle) * CIRCLE_RADIUS
    ];
};

// --- Components ---

const NodeObj = ({
    position,
    id,
    status
}: {
    position: [number, number, number];
    id: number;
    status: 'default' | 'active' | 'processing';
}) => {
    // Animate color change
    const { color } = useSpring({
        color: status === 'active' ? COLOR_ACTIVE : status === 'processing' ? COLOR_PROCESSING : COLOR_NODE,
        config: { duration: 500 }
    });

    return (
        <animated.group position={position}>
            <Box args={[NODE_SIZE, NODE_SIZE, NODE_SIZE]}>
                {/* @ts-ignore: react-spring color type compatibility */}
                <animated.meshStandardMaterial color={color} />
                <Edges color={COLOR_EDGE_DEFAULT} threshold={1} />
            </Box>
            <Text
                position={[0, NODE_SIZE + 0.5, 0]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="bottom"
            >
                {id}
            </Text>
        </animated.group>
    );
};

const EdgeObj = ({
    start,
    end,
    isActive
}: {
    start: [number, number, number];
    end: [number, number, number];
    isActive: boolean;
}) => {
    return (
        <Line
            points={[start, end]}
            color={isActive ? COLOR_ACTIVE : COLOR_EDGE_DEFAULT}
            lineWidth={isActive ? 3 : 1}
        />
    );
};

// --- Main Component ---
const GraphLevel: React.FC<{ showGrid: boolean }> = ({ showGrid }) => {
    // State
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [adjList, setAdjList] = useState<Record<number, number[]>>({});
    const [nodeStatus, setNodeStatus] = useState<Record<number, 'default' | 'active' | 'processing'>>({});
    const [queueDisplay, setQueueDisplay] = useState<number[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [message, setMessage] = useState("Ready");
    const [traversalResult, setTraversalResult] = useState<number[]>([]);

    // Toggle Code Window
    const [showCode, setShowCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // UI Inputs
    const [edgeFrom, setEdgeFrom] = useState("");
    const [edgeTo, setEdgeTo] = useState("");
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

    // Initialize with 6 nodes
    useEffect(() => {
        const initialCount = 6;
        const newNodes: GraphNode[] = [];
        const newAdj: Record<number, number[]> = {};

        for (let i = 0; i < initialCount; i++) {
            newNodes.push({ id: i, position: getCircularPosition(i, initialCount) });
            newAdj[i] = [];
            setNodeStatus(prev => ({ ...prev, [i]: 'default' }));
        }

        // Add some default edges
        newAdj[0].push(1); newAdj[0].push(2);
        newAdj[1].push(3);
        newAdj[2].push(4);
        newAdj[4].push(5);

        setNodes(newNodes);
        setAdjList(newAdj);
    }, []);

    // Recalculate positions if node count changes (dynamic circle)
    useEffect(() => {
        setNodes(prev => prev.map((node) => ({
            ...node,
            position: getCircularPosition(node.id, prev.length)
        })));
    }, [nodes.length]);

    // Reset / Clear
    const clearGraph = () => {
        if (isAnimating) return;
        setNodes([]);
        setAdjList({});
        setNodeStatus({});
        setQueueDisplay([]);
        setTraversalResult([]);
        setMessage("Graph Cleared");
    };

    const resetGraph = () => {
        // Default graph
        const initialNodes: GraphNode[] = [];
        const total = 5;
        for (let i = 0; i < total; i++) {
            initialNodes.push({ id: i, position: getCircularPosition(i, total) });
        }

        const initialAdj: Record<number, number[]> = {
            0: [1, 2],
            1: [3],
            2: [4],
            3: [],
            4: []
        };

        setNodes(initialNodes);
        setAdjList(initialAdj);
        setNodeStatus({});
        setQueueDisplay([]);
        setTraversalResult([]);
        setIsAnimating(false); // Ensure animation state is reset
        setMessage("Reset to Default Graph");
    };

    // Initialize Default Graph on Mount
    useEffect(() => {
        resetGraph();
    }, []);

    const addNode = () => {
        if (isAnimating) return;
        const newId = nodes.length; // Simple increment ID
        const newNodes = [...nodes, { id: newId, position: getCircularPosition(newId, nodes.length + 1) }];

        // Re-calculate positions for circle
        const updatedNodes = newNodes.map((n, i) => ({
            ...n,
            position: getCircularPosition(i, newNodes.length)
        }));

        setNodes(updatedNodes);
        setAdjList(prev => ({ ...prev, [newId]: [] }));
        setNodeStatus(prev => ({ ...prev, [newId]: 'default' }));
        setMessage(`Added Node ${newId}`);
    };

    const addEdge = () => {
        if (isAnimating) return;
        const u = parseInt(edgeFrom);
        const v = parseInt(edgeTo);

        if (isNaN(u) || isNaN(v)) {
            setMessage("Invalid Node IDs");
            return;
        }
        if (!nodes.find(n => n.id === u) || !nodes.find(n => n.id === v)) {
            setMessage("Node does not exist");
            return;
        }
        if (u === v) {
            setMessage("Cannot connect self");
            return;
        }
        if (adjList[u]?.includes(v)) {
            setMessage("Edge already exists");
            return;
        }

        setAdjList(prev => ({
            ...prev,
            [u]: [...(prev[u] || []), v],
            [v]: [...(prev[v] || []), u] // Undirected for consistency
        }));
        setMessage(`Connected ${u} - ${v}`);
        setEdgeFrom("");
        setEdgeTo("");
    };

    const runBFS = async () => {
        if (isAnimating) return;
        if (nodes.length === 0) return;

        setIsAnimating(true);
        setMessage("Starting BFS from Node 0...");
        setTraversalResult([]); // Clear previous result

        // Reset statuses
        const resetStatus: any = {};
        nodes.forEach(n => resetStatus[n.id] = 'default');
        setNodeStatus(resetStatus);

        const queue: number[] = [0];
        const visited = new Set<number>();
        visited.add(0);

        setQueueDisplay([...queue]);

        // Highlight start
        setHighlightedLine(2); // queue.push(start)
        setNodeStatus(prev => ({ ...prev, 0: 'processing' }));
        await new Promise(r => setTimeout(r, 1000));

        setHighlightedLine(3); // visited...
        setNodeStatus(prev => ({ ...prev, 0: 'active' }));
        await new Promise(r => setTimeout(r, 500));

        setHighlightedLine(4); // while loop
        while (queue.length > 0) {
            setHighlightedLine(5); // front
            const current = queue.shift()!;
            setQueueDisplay([...queue]);
            setTraversalResult(prev => [...prev, current]); // Add to result

            setHighlightedLine(6); // pop
            await new Promise(r => setTimeout(r, 500));

            // Get neighbors
            const neighbors = adjList[current] || [];
            if (neighbors.length > 0) {
                setMessage(`Visiting neighbors of ${current}: [${neighbors.join(', ')}]`);
                setHighlightedLine(7); // for loop
                await new Promise(r => setTimeout(r, 500));

                // Process neighbors
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor)) {
                        setHighlightedLine(8); // if !visited
                        await new Promise(r => setTimeout(r, 300));

                        visited.add(neighbor);
                        queue.push(neighbor);

                        setHighlightedLine(9); // visited = true
                        setNodeStatus(prev => ({ ...prev, [neighbor]: 'processing' }));
                        await new Promise(r => setTimeout(r, 300));

                        setHighlightedLine(10); // queue.push
                        setQueueDisplay([...queue]);
                        await new Promise(r => setTimeout(r, 500));
                    }
                }

                // Wait for visual effect
                // Mark processed neighbors as active (visited layer complete)
                for (const neighbor of neighbors) {
                    if (nodeStatus[neighbor] !== 'active') {
                        setNodeStatus(prev => ({ ...prev, [neighbor]: 'active' }));
                    }
                }
            }
            setHighlightedLine(4); // back to while
        }

        setMessage("BFS Complete!");
        setHighlightedLine(null);
        setIsAnimating(false);
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                <CameraControls makeDefault />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                {showGrid && <gridHelper args={[20, 20, 0x222222, 0x111111]} />}

                {/* Render Nodes */}
                <Suspense fallback={null}>
                    {nodes.map(node => (
                        <NodeObj
                            key={node.id}
                            id={node.id}
                            position={node.position}
                            status={nodeStatus[node.id] || 'default'}
                        />
                    ))}
                </Suspense>

                {/* Render Edges */}
                {Object.entries(adjList).map(([fromStr, toList]) => {
                    const from = parseInt(fromStr);
                    const startNode = nodes.find(n => n.id === from);
                    if (!startNode) return null;

                    return toList.map((to, i) => {
                        const endNode = nodes.find(n => n.id === to);
                        if (!endNode) return null;
                        return (
                            <EdgeObj
                                key={`${from}-${to}-${i}`}
                                start={startNode.position}
                                end={endNode.position}
                                isActive={nodeStatus[from] === 'active' && nodeStatus[to] === 'active'} // Simple active logic
                            />
                        );
                    });
                })}
            </Canvas>

            {/* UI Overlay - Sibling to Canvas */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur border-t border-cyan-500 pointer-events-auto flex items-center justify-between p-4 z-50">
                {/* Left Section: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">GRAPH TRAVERSAL</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{message}</div>
                </div>

                {/* Center Section: Controls */}
                <div className="flex items-center gap-6">
                    {/* Group 1: Buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={addNode}
                            className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                            disabled={isAnimating}
                        >
                            + Node
                        </button>
                        <button
                            onClick={clearGraph}
                            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                            disabled={isAnimating}
                        >
                            Clear
                        </button>
                        <button
                            onClick={runBFS}
                            className="px-4 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-500/50 rounded hover:bg-yellow-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                            disabled={isAnimating}
                        >
                            Run BFS
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-700"></div>

                    {/* Group 2: Link Inputs */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded border border-slate-700">
                            <input
                                className="w-10 bg-transparent text-center text-sm text-white focus:outline-none font-mono"
                                placeholder="U"
                                value={edgeFrom}
                                onChange={e => setEdgeFrom(e.target.value)}
                            />
                            <span className="text-slate-500 text-xs">→</span>
                            <input
                                className="w-10 bg-transparent text-center text-sm text-white focus:outline-none font-mono"
                                placeholder="V"
                                value={edgeTo}
                                onChange={e => setEdgeTo(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={addEdge}
                            className="px-3 py-1 bg-slate-700 hover:bg-cyan-600 text-white rounded text-xs font-bold uppercase transition-colors border border-slate-600 hover:border-cyan-500"
                            disabled={isAnimating}
                        >
                            Link
                        </button>
                    </div>
                </div>

                {/* Right Section: Status/Output */}
                <div className="flex items-center gap-8 text-right">
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Queue</div>
                        <div className="text-yellow-400 font-mono text-sm font-bold bg-black/20 px-2 py-0.5 rounded border border-yellow-500/20 min-w-[60px] text-center">
                            [{queueDisplay.length > 0 ? queueDisplay.join(', ') : ''}]
                        </div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">BFS Result</div>
                        <div className="text-green-400 font-mono text-sm bg-black/20 px-2 py-0.5 rounded border border-green-500/20 min-w-[80px] text-center">
                            {traversalResult.length > 0 ? traversalResult.join(' → ') : '-'}
                        </div>
                    </div>

                    {/* Info Button */}
                    <button
                        onClick={() => setShowInfo(true)}
                        className="p-2 rounded-lg transition-colors bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/40"
                        title="Show Info"
                    >
                        <Info size={20} />
                    </button>

                    {/* Code Toggle Icon */}
                    <button
                        onClick={() => setShowCode(!showCode)}
                        className={`p-2 rounded-lg transition-colors border ${showCode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'}`}
                        title="Toggle Code"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Code Window - Floating independent of the bar */}
            {showCode && (
                <div className="absolute top-20 right-8 pointer-events-auto z-20">
                    <CodeWindow
                        code={BFS_CODE}
                        highlightedLine={highlightedLine}
                        title="BFS Algorithm"
                        onClose={() => setShowCode(false)}
                    />
                </div>
            )}

            {/* Info Modal */}
            {showInfo && (
                <InfoModal
                    type="GRAPH"
                    onClose={() => setShowInfo(false)}
                />
            )}
        </div>
    );
};

export default GraphLevel;
