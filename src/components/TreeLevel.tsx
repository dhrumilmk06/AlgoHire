import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Text, Sphere, Tube } from '@react-three/drei';
import CameraControls from './3d/CameraControls';
import { Canvas } from '@react-three/fiber';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';
import { CodeWindow } from './ui/CodeWindow';
import { InfoModal } from './InfoModal';
import { Info } from 'lucide-react';

// --- Type Definitions ---
interface TreeNodeData {
    value: number;
    left: TreeNodeData | null;
    right: TreeNodeData | null;
    position: [number, number, number];
    id: string; // Unique ID for finding paths
}

interface TreeLevelProps {
    showGrid?: boolean;
}

// --- Constants & Styles ---
const ROOT_POS: [number, number, number] = [0, 5, 0];
const NODE_RADIUS = 0.6;
const X_OFFSET_INITIAL = 4;
const Y_OFFSET = 2;

// Colors
const COLOR_NODE_FACE = '#0a192f'; // Dark Navy
const COLOR_NODE_WIRE = '#00ffff'; // Neon Blue
const COLOR_CONNECTION = '#ffffff'; // Bright White
const COLOR_HIGHLIGHT = '#00ff00'; // Bright Green (for search)
const COLOR_ERROR = '#ff0000'; // Red (for not found)

// --- Helper Functions ---

// Generate a unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Calculate position for a child node
const getChildPosition = (
    parentPos: [number, number, number],
    direction: 'left' | 'right',
    depth: number
): [number, number, number] => {
    const [x, y, z] = parentPos;
    // Reduce horizontal spread as we go deeper
    const spread = Math.max(1, X_OFFSET_INITIAL / Math.pow(1.3, depth));
    const newX = direction === 'left' ? x - spread : x + spread;
    return [newX, y - Y_OFFSET, z];
};

// --- Components ---

const TreeNode = ({
    position,
    value,
    isHighlighted,
    highlightColor = COLOR_HIGHLIGHT,
}: {
    position: [number, number, number];
    value: number;
    isHighlighted: boolean;
    highlightColor?: string;
}) => {
    const { scale } = useSpring({
        scale: isHighlighted ? 1.2 : 1,
        config: config.wobbly,
    });

    return (
        <animated.group position={position} scale={scale}>
            {/* Visual Sphere */}
            <Sphere args={[NODE_RADIUS, 32, 32]}>
                <meshStandardMaterial
                    color={COLOR_NODE_FACE}
                    roughness={0.3}
                    metalness={0.8}
                />
            </Sphere>
            {/* Wireframe Overlay */}
            <Sphere args={[NODE_RADIUS + 0.05, 16, 16]}>
                <meshBasicMaterial wireframe color={isHighlighted ? highlightColor : COLOR_NODE_WIRE} />
            </Sphere>

            {/* Text Label */}
            <Text
                position={[0, 0, NODE_RADIUS + 0.2]}
                fontSize={0.5}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
        </animated.group>
    );
};

const Connection = ({
    start,
    end,
    isHighlighted,
    highlightColor = COLOR_HIGHLIGHT,
}: {
    start: [number, number, number];
    end: [number, number, number];
    isHighlighted: boolean;
    highlightColor?: string;
}) => {
    const path = React.useMemo(() => {
        return new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end));
    }, [start, end]);

    return (
        <Tube args={[path, 1, 0.05, 8, false]}>
            <meshBasicMaterial color={isHighlighted ? highlightColor : COLOR_CONNECTION} />
        </Tube>
    );
};

const RecursiveTree = ({
    node,
    highlightedIds = [], // Default to empty array
    searchResult, // Receive search status
    depth = 0,
}: {
    node: TreeNodeData;
    highlightedIds: string[];
    searchResult?: 'found' | 'not-found' | null;
    depth?: number;
}) => {
    const isHighlighted = highlightedIds.includes(node.id);
    const highlightColor = searchResult === 'not-found' ? COLOR_ERROR : COLOR_HIGHLIGHT;

    return (
        <group>
            <TreeNode
                position={node.position}
                value={node.value}
                isHighlighted={isHighlighted}
                highlightColor={highlightColor}
            />

            {node.left && (
                <>
                    <Connection
                        start={node.position}
                        end={node.left.position}
                        isHighlighted={isHighlighted && highlightedIds.includes(node.left.id)}
                        highlightColor={highlightColor}
                    />
                    <RecursiveTree
                        node={node.left}
                        highlightedIds={highlightedIds}
                        searchResult={searchResult}
                        depth={depth + 1}
                    />
                </>
            )}

            {node.right && (
                <>
                    <Connection
                        start={node.position}
                        end={node.right.position}
                        isHighlighted={isHighlighted && highlightedIds.includes(node.right.id)}
                        highlightColor={highlightColor}
                    />
                    <RecursiveTree
                        node={node.right}
                        highlightedIds={highlightedIds}
                        searchResult={searchResult}
                        depth={depth + 1}
                    />
                </>
            )}
        </group>
    );
};

/**
 * The Animation Ball that travels down the tree during insertion.
 */
const TravelingNode = ({
    targetValue,
    path,
    onComplete,
}: {
    targetValue: number;
    path: [number, number, number][]; // Sequence of positions to visit
    onComplete: () => void;
}) => {
    const indexRef = useRef(0);

    // Spring animation for position
    const [spring, api] = useSpring(() => ({
        position: path[0],
        config: { tension: 120, friction: 20 },
        onRest: () => {
            const nextIndex = indexRef.current + 1;
            if (nextIndex < path.length) {
                indexRef.current = nextIndex;
                api.start({ position: path[nextIndex] });
            } else {
                onComplete();
            }
        }
    }));

    // Trigger animation start
    useEffect(() => {
        if (path.length > 1) {
            // Start moving to the first target (index 1)
            indexRef.current = 1;
            api.start({ position: path[1] });
        } else {
            onComplete();
        }
    }, [path, api, onComplete]);

    return (
        <animated.group position={spring.position}>
            <Sphere args={[NODE_RADIUS, 32, 32]}>
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={0.5} />
            </Sphere>
            <Text position={[0, 0, NODE_RADIUS + 0.2]} fontSize={0.5} color="white">
                {targetValue}
            </Text>
        </animated.group>
    );
};

// --- Main Component ---

// --- Code Constants ---
const INSERT_CODE = [
    "// Recursively Insert Node",
    "Node* insert(Node* root, int val) {",
    "    if (root == NULL)",
    "        return new Node(val);",
    "",
    "    if (val < root->val)",
    "        root->left = insert(root->left, val);",
    "    else if (val > root->val)",
    "        root->right = insert(root->right, val);",
    "",
    "    return root;",
    "}"
].join('\n');

const SEARCH_CODE = [
    "// Recursively Search Node",
    "Node* search(Node* root, int val) {",
    "    if (root == NULL || root->val == val)",
    "        return root;",
    "",
    "    if (val < root->val)",
    "        return search(root->left, val);",
    "",
    "    return search(root->right, val);",
    "}"
].join('\n');

const TreeLevel: React.FC<TreeLevelProps> = ({ showGrid = true }) => {
    const [root, setRoot] = useState<TreeNodeData | null>(null);
    const [inputValue, setInputValue] = useState<string>('');
    const [searchValue, setSearchValue] = useState<string>('');
    const [searchResult, setSearchResult] = useState<'found' | 'not-found' | null>(null);

    // Toggle for code window
    const [showCode, setShowCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const [isAnimating, setIsAnimating] = useState(false);
    const [animationProps, setAnimationProps] = useState<{ value: number; path: [number, number, number][] } | null>(null);

    const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
    const [message, setMessage] = useState<string>('Ready');

    // Code Window State
    const [codeSnippet, setCodeSnippet] = useState(INSERT_CODE);
    const [codeTitle, setCodeTitle] = useState('BST Insert');
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

    // Logic to calculate insertion path without mutating state yet
    const getInsertionPath = (value: number, currentNode: TreeNodeData | null, currentPos: [number, number, number], depth: number): [number, number, number][] => {
        const path: [number, number, number][] = [currentPos];

        if (!currentNode) {
            return path; // Should be the final settling spot
        }

        if (value < currentNode.value) {
            if (!currentNode.left) {
                const finalPos = getChildPosition(currentNode.position, 'left', depth);
                path.push(finalPos);
                return path;
            }
            return [...path, ...getInsertionPath(value, currentNode.left, currentNode.left.position, depth + 1)];
        } else {
            if (!currentNode.right) {
                const finalPos = getChildPosition(currentNode.position, 'right', depth);
                path.push(finalPos);
                return path;
            }
            return [...path, ...getInsertionPath(value, currentNode.right, currentNode.right.position, depth + 1)];
        }
    };

    const handleInsert = () => {
        const val = parseInt(inputValue);
        if (isNaN(val)) return;
        if (isAnimating) return;

        setMessage(`Inserting ${val}...`);
        setIsAnimating(true);
        setHighlightedIds([]);
        setSearchResult(null);

        // Update Code Window
        setCodeSnippet(INSERT_CODE);
        setCodeTitle('BST Insert');
        setHighlightedLine(3);

        if (!root) {
            // First node, no animation traversal needed, just spawn
            const newNode: TreeNodeData = {
                value: val,
                left: null,
                right: null,
                position: ROOT_POS,
                id: generateId()
            };
            setRoot(newNode);
            setIsAnimating(false);
            setMessage(`Inserted ${val} as Root`);
            setInputValue('');
            return;
        }

        // Calculate path for animation
        // The path should start at Root Position and follow logical path to the empty spot
        const path = getInsertionPath(val, root, root.position, 0);
        setAnimationProps({ value: val, path });
    };

    const onAnimationComplete = () => {
        // Actually insert the node into the state tree
        if (!animationProps) return;
        const { value } = animationProps;

        const insertNode = (node: TreeNodeData | null, depth: number, pos: [number, number, number]): TreeNodeData => {
            if (!node) {
                return { value, left: null, right: null, position: pos, id: generateId() };
            }
            if (value < node.value) {
                // If going left
                if (!node.left) {
                    const newPos = getChildPosition(node.position, 'left', depth);
                    return { ...node, left: { value, left: null, right: null, position: newPos, id: generateId() } };
                }
                return { ...node, left: insertNode(node.left, depth + 1, node.left!.position) };
            } else {
                if (!node.right) {
                    const newPos = getChildPosition(node.position, 'right', depth);
                    return { ...node, right: { value, left: null, right: null, position: newPos, id: generateId() } };
                }
                return { ...node, right: insertNode(node.right, depth + 1, node.right!.position) };
            }
        };

        setRoot(prev => insertNode(prev!, 0, ROOT_POS));
        setIsAnimating(false);
        setAnimationProps(null);
        setMessage(`Inserted ${value} `);
        setInputValue('');
    };


    const handleSearch = () => {
        const val = parseInt(searchValue);
        if (isNaN(val)) return;

        setMessage(`Searching for ${val}...`);

        // Update Code Window
        setCodeSnippet(SEARCH_CODE);
        setCodeTitle('BST Search');
        setHighlightedLine(3);

        const pathIds: string[] = [];
        setSearchResult(null);

        const search = (node: TreeNodeData | null): boolean => {
            if (!node) return false;
            pathIds.push(node.id);
            if (node.value === val) return true;

            if (val < node.value) {
                return search(node.left);
            } else {
                return search(node.right);
            }
        };

        const found = search(root);
        if (found) {
            setHighlightedIds(pathIds);
            setSearchResult('found');
            setMessage(`Found ${val}!`);
        } else {
            setHighlightedIds(pathIds); // Show path taken even if failed
            setSearchResult('not-found');
            setMessage(`${val} not found.`);
        }
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [0, 5, 20], fov: 50 }}>
                <CameraControls makeDefault />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 20, 10]} intensity={1} />
                {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -5, 0]} />}

                <Suspense fallback={null}>
                    {root && <RecursiveTree node={root} searchResult={searchResult} highlightedIds={highlightedIds} />}

                    {isAnimating && animationProps && (
                        <TravelingNode
                            targetValue={animationProps.value}
                            path={animationProps.path}
                            onComplete={onAnimationComplete}
                        />
                    )}
                </Suspense>
            </Canvas>

            {/* UI Dock (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                {/* Left Section: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">BINARY TREE</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">{message}</div>
                </div>

                {/* Center Section: Controls */}
                <div className="flex items-center gap-8">
                    {/* Insert Control */}
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInsert()}
                            placeholder="Val"
                        />
                        <button
                            onClick={handleInsert}
                            disabled={isAnimating}
                            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            Insert
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-800"></div>

                    {/* Search Control */}
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Val"
                        />
                        <button
                            onClick={handleSearch}
                            className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded hover:bg-green-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            Find
                        </button>
                    </div>
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


            {/* Code Window (Top Right) */}
            {
                showCode && (
                    <div className="absolute top-20 right-5 z-20 pointer-events-auto">
                        <CodeWindow
                            code={codeSnippet}
                            title={codeTitle}
                            highlightedLine={highlightedLine}
                            onClose={() => setShowCode(false)}
                        />
                    </div>
                )
            }

            {/* Info Modal */}
            {
                showInfo && (
                    <InfoModal
                        type="TREE"
                        onClose={() => setShowInfo(false)}
                    />
                )
            }
        </div >
    );
};

export default TreeLevel;
