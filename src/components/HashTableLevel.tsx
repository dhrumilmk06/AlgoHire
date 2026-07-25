import { useState, useRef } from 'react';
import { useFrame, Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import CameraControls from './3d/CameraControls';
import * as THREE from 'three';
import { CodeWindow } from './ui/CodeWindow';
import { InfoModal } from './InfoModal';
import { Info } from 'lucide-react';

// --- Types ---
type HashItem = {
    id: number;
    key: string;
    value: string;
    bucketIndex: number;
    chainIndex: number; // Height in the stack
};

// --- Components ---

// 1. The "Server Rack" Bucket
const BucketSlot = ({ index }: { index: number }) => {
    return (
        <group position={[index * 2.5 - 11, 0, 0]}>
            {/* The Base/Slot */}
            <mesh receiveShadow position={[0, -0.5, 0]}>
                <boxGeometry args={[2, 0.2, 2]} />
                <meshStandardMaterial color="#0f172a" /> {/* Dark Slate */}
            </mesh>

            {/* Glowing Border */}
            <lineSegments position={[0, -0.4, 0]}>
                <edgesGeometry args={[new THREE.BoxGeometry(2, 0.2, 2)]} />
                <lineBasicMaterial color="#0ea5e9" linewidth={2} /> {/* Sky Blue */}
            </lineSegments>

            {/* Index Label */}
            <Text
                position={[0, 0, 1.5]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={0.8}
                color="#0ea5e9"
            >
                {index}
            </Text>
        </group>
    );
};

// 2. The Data Block (The "Value")
const DataBlock = ({ item }: { item: HashItem }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Animation: Lerp to target position
    useFrame((_, delta) => {
        if (!meshRef.current) return;

        // Target: X based on bucket, Y based on chain height
        const targetX = item.bucketIndex * 2.5 - 11;
        const targetY = item.chainIndex * 1.2 + 0.6; // Stack up
        const targetZ = 0;

        // Smooth movement (Linear Interpolation)
        meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 5 * delta);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 5 * delta);
        meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, 5 * delta);
    });

    return (
        <group>
            <mesh
                ref={meshRef}
                position={[0, 10, 5]} // Spawn high up and front
            >
                <boxGeometry args={[1.8, 1, 1.8]} />
                <meshStandardMaterial color="#1e3a8a" transparent opacity={0.9} /> {/* Navy Blue */}

                {/* Wireframe Edge */}
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(1.8, 1, 1.8)]} />
                    <lineBasicMaterial color="#22d3ee" /> {/* Cyan */}
                </lineSegments>

                {/* Text Label */}
                <Text position={[0, 0, 1]} fontSize={0.35} color="white">
                    {`${item.key}:${item.value}`}
                </Text>
            </mesh>
        </group>
    );
};

const HASH_CODE = `int hash(string key) {
  int sum = 0;
  for (char c : key) sum += c;
  return sum % 10;
}

void insert(string key, string val) {
  int idx = hash(key);
  // Separate Chaining
  buckets[idx].push({key, val});
}`;

// --- Main Level Component ---
export default function HashTableLevel({ showGrid }: { showGrid: boolean }) {
    const [items, setItems] = useState<HashItem[]>([]);
    const [inputKey, setInputKey] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState('Ready to Hash...');
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

    const [showCode, setShowCode] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    // Simple Hash Function: Sum of char codes % 10
    const calculateHash = (key: string) => {
        let sum = 0;
        for (let i = 0; i < key.length; i++) {
            sum += key.charCodeAt(i);
        }
        return sum % 10;
    };

    const handleInsert = async () => {
        if (!inputKey || !inputValue) return;

        if (showCode) setHighlightedLine(1); // hash function start
        await new Promise(r => setTimeout(r, 500));

        const bucketIndex = calculateHash(inputKey);
        if (showCode) setHighlightedLine(3); // sum += c
        await new Promise(r => setTimeout(r, 500));

        if (showCode) setHighlightedLine(4); // return sum % 10
        await new Promise(r => setTimeout(r, 500));

        // Check collision/chain height
        const existingInBucket = items.filter(i => i.bucketIndex === bucketIndex);
        const chainIndex = existingInBucket.length;

        const newItem: HashItem = {
            id: Date.now(),
            key: inputKey,
            value: inputValue,
            bucketIndex,
            chainIndex
        };

        if (showCode) setHighlightedLine(8); // insert function
        await new Promise(r => setTimeout(r, 300));
        setLog(`Hash("${inputKey}") = ${bucketIndex} \nPlacing at Index ${bucketIndex}, Height ${chainIndex}`);

        if (showCode) setHighlightedLine(10); // push to bucket
        setItems([...items, newItem]);
        await new Promise(r => setTimeout(r, 500));

        setInputKey('');
        setInputValue('');
        setHighlightedLine(null);
    };

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            <Canvas camera={{ position: [5, 10, 15], fov: 45 }}>
                <CameraControls
                    makeDefault
                    minDistance={5}
                    maxDistance={30}
                    maxPolarAngle={Math.PI / 2.5}
                />
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 10, 5]} intensity={1} />
                {showGrid && <gridHelper args={[100, 100, 0x1e293b, 0x0f172a]} position={[0, -0.5, 0]} />}

                {/* Render 10 Buckets */}
                {Array.from({ length: 10 }).map((_, i) => (
                    <BucketSlot key={i} index={i} />
                ))}

                {/* Render Items */}
                {items.map(item => (
                    <DataBlock key={item.id} item={item} />
                ))}
            </Canvas>

            {/* UI Dock (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                {/* Left Section: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">HASH TABLE</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Separate Chaining</div>
                </div>

                {/* Center Section: Controls */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <input
                            className="w-32 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            placeholder="Key"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                        />
                        <input
                            className="w-32 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            placeholder="Value"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button
                            onClick={handleInsert}
                            className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 rounded hover:bg-cyan-600/40 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            Insert
                        </button>
                    </div>
                </div>

                {/* Right Section: Log & Code Toggle */}
                <div className="flex items-center gap-6">
                    <div className="text-xs text-green-400 font-mono text-right max-w-[300px] whitespace-pre-wrap">
                        {log}
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

            {/* Code Window (Top Right) */}
            {showCode && (
                <div className="absolute top-20 right-5 z-20 pointer-events-auto">
                    <CodeWindow
                        code={HASH_CODE}
                        highlightedLine={highlightedLine}
                        title="Hash Table Logic"
                        onClose={() => setShowCode(false)}
                    />
                </div>
            )}

            {/* Info Modal */}
            {showInfo && (
                <InfoModal
                    type="HASH"
                    onClose={() => setShowInfo(false)}
                />
            )}
        </div>
    );
}
