import { useState, useRef, useEffect } from 'react'
import { Text } from '@react-three/drei'
import CameraControls from '../3d/CameraControls'
import { Canvas, useFrame } from '@react-three/fiber'
import { LinkedListNode } from '../3d/LinkedListNode'
import { CodeWindow } from '../ui/CodeWindow'
import { InfoModal } from '../InfoModal'
import { Info } from 'lucide-react'
import * as THREE from 'three'
import { useSpring, a } from '@react-spring/three'

type ConfigNode = {
    id: number
    value: number
    nextId: number | null
}

const INSERT_HEAD_CODE = `Node newNode = new Node(value);
newNode.next = head;
head = newNode;`

// Internal Animated Components
const AnimatedGroup = a.group

const MovingNode = ({ position, value }: { position: [number, number, number], value: number }) => {
    const { pos } = useSpring({
        pos: position,
        config: { mass: 1, tension: 120, friction: 14 } // Smooth movement
    })

    return (
        <AnimatedGroup position={pos}>
            <LinkedListNode value={value} position={[0, 0, 0]} />
        </AnimatedGroup>
    )
}

const MovingArrow = ({ start, end }: { start: [number, number, number], end: [number, number, number] }) => {
    // We animatethe start/end points
    const { s, e } = useSpring({
        s: start,
        e: end,
        config: { mass: 1, tension: 120, friction: 14 }
    })

    // We need a ref to update the cylinder geometry/transform based on the interpolated start/end
    const groupRef = useRef<THREE.Group>(null)
    const cylinderRef = useRef<THREE.Mesh>(null)
    const coneRef = useRef<THREE.Mesh>(null)

    useFrame(() => {
        if (!groupRef.current) return

        const startVec = new THREE.Vector3(...s.get())
        const endVec = new THREE.Vector3(...e.get())

        const direction = new THREE.Vector3().subVectors(endVec, startVec)
        const fullLength = direction.length()
        direction.normalize()

        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

        const offset = 1.4
        const renderLength = Math.max(0.1, fullLength - (offset * 2))

        const midPoint = new THREE.Vector3()
            .addVectors(startVec, endVec)
            .multiplyScalar(0.5)

        // Update Group Transform
        groupRef.current.position.copy(midPoint)
        groupRef.current.quaternion.copy(quaternion)

        // Update Shapes
        if (cylinderRef.current) {
            cylinderRef.current.scale.set(1, renderLength, 1)
        }
        if (coneRef.current) {
            coneRef.current.position.y = renderLength / 2
        }
    })

    return (
        <group ref={groupRef}>
            {/* Shaft */}
            <mesh ref={cylinderRef} position={[0, 0, 0]}>
                {/* Cylinder height is 1 by default, scaled to renderLength */}
                <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>
            {/* Head */}
            <mesh ref={coneRef}>
                <coneGeometry args={[0.25, 0.6, 16]} />
                <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.8} />
            </mesh>
        </group>
    )
}

function MovingLabel({ position, text }: { position: [number, number, number], text: string }) {
    const { pos } = useSpring({
        pos: position,
        config: { mass: 1, tension: 120, friction: 14 }
    })

    return (
        <a.group position={pos}>
            <Text
                position={[0, 0, 0]}
                fontSize={0.6}
                color="#facc15"
            >
                {text}
            </Text>
        </a.group>
    )
}

export const LinkedListLevel = ({ showGrid }: { showGrid: boolean }) => {
    const [nodes, setNodes] = useState<ConfigNode[]>([])
    const [isAnimating, setIsAnimating] = useState(false)
    const [headId, setHeadId] = useState<number | null>(null)

    // Code Window State
    const [codeSnippet, setCodeSnippet] = useState(INSERT_HEAD_CODE)
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
    const [codeTitle, setCodeTitle] = useState('Insert at Head')
    const [showCode, setShowCode] = useState(false)
    const [showInfo, setShowInfo] = useState(false)

    // Initial Setup
    useEffect(() => {
        // Create 3 initial nodes
        const initialNodes: ConfigNode[] = [
            { id: 2, value: 30, nextId: 1 },
            { id: 1, value: 20, nextId: 0 },
            { id: 0, value: 10, nextId: null }
        ]
        // In our visual list, index 0 is left-most (Head).
        // Let's make id 2 the head, then 1, then 0.
        // Array order: [Head, Next, Next]
        setNodes(initialNodes)
        setHeadId(2)
    }, [])

    const handleInsertHead = async () => {
        if (nodes.length >= 10) return // Limit to 10 for cleaner view
        setIsAnimating(true)

        setCodeTitle('Insert at Head')
        setCodeSnippet(INSERT_HEAD_CODE)

        setHighlightedLine(1)
        await new Promise(r => setTimeout(r, 600))

        const newValue = Math.floor(Math.random() * 100)
        // Use unique ID
        const newId = Date.now()
        const oldHeadId = headId

        const newNode: ConfigNode = {
            id: newId,
            value: newValue,
            nextId: oldHeadId
        }

        setHighlightedLine(2)
        // Prepend to array
        setNodes(prev => [newNode, ...prev])
        // Note: At this moment, node appears at index 0 (x=0). 
        // Existing nodes shift right automatically via spring.

        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(3)
        setHeadId(newId)
        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(null)
        setIsAnimating(false)
    }

    const handleDeleteHead = async () => {
        if (nodes.length === 0 || headId === null) return
        setIsAnimating(true)

        const DELETE_HEAD_CODE = `if (head == null) return;
Node temp = head;
head = head.next;
delete temp;`

        setCodeTitle('Delete Head')
        setCodeSnippet(DELETE_HEAD_CODE)

        setHighlightedLine(2)
        await new Promise(r => setTimeout(r, 600))

        const currentHead = nodes.find(n => n.id === headId)
        if (!currentHead) {
            setIsAnimating(false)
            return
        }

        setHighlightedLine(3)
        const nextId = currentHead.nextId
        setHeadId(nextId !== null ? nextId : null)
        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(4)
        // Remove from array -> remaining nodes shift left
        setNodes(prev => prev.filter(n => n.id !== currentHead.id))
        await new Promise(r => setTimeout(r, 600))

        setHighlightedLine(null)
        setIsAnimating(false)
    }

    const headNode = nodes.find(n => n.id === headId)
    // Find index of head for label position
    const headIndex = headNode ? nodes.indexOf(headNode) : -1

    return (
        <div className="absolute inset-0 left-20 h-full bg-slate-950 overflow-hidden">
            {/* Adjusted Camera Position */}
            <Canvas camera={{ position: [-2, 5, 15], fov: 50 }}>
                <CameraControls makeDefault minDistance={10} maxDistance={60} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                {showGrid && <gridHelper args={[100, 50, '#004444', '#002222']} position={[0, -2, 0]} />}

                {/* Render Nodes */}
                {nodes.map((node, index) => {
                    // Calculate target position based on index
                    const position: [number, number, number] = [index * 3.5, 0, 0]

                    return (
                        <MovingNode
                            key={node.id}
                            position={position}
                            value={node.value}
                        />
                    )
                })}

                {/* Render Arrows */}
                {nodes.map((node, index) => {
                    if (node.nextId === null) return null

                    // We need to find where the next node IS visually.
                    // The next node logic relies on IDs.
                    const nextNodeIndex = nodes.findIndex(n => n.id === node.nextId)

                    if (nextNodeIndex === -1) return null

                    const startPos: [number, number, number] = [index * 3.5, 0, 0]
                    const endPos: [number, number, number] = [nextNodeIndex * 3.5, 0, 0]

                    return (
                        <MovingArrow
                            key={`arrow-${node.id}-${node.nextId}`}
                            start={startPos}
                            end={endPos}
                        />
                    )
                })}

                {/* Head Label */}
                {headIndex !== -1 && (
                    <MovingLabel position={[headIndex * 3.5, 2.0, 0]} text="HEAD" />
                )}
            </Canvas>

            {/* UI Dock (Bottom) */}
            <div className="absolute bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-md border-t border-cyan-500/50 p-4 flex justify-between z-50 pointer-events-auto">
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">LINKED LIST</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Count: {nodes.length}</div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={handleInsertHead}
                        disabled={isAnimating || nodes.length >= 10}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Insert Head
                    </button>

                    <button
                        onClick={handleDeleteHead}
                        disabled={isAnimating || nodes.length === 0}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/50 rounded hover:bg-red-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        Delete Head
                    </button>
                </div>

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

            {showInfo && <InfoModal type="LINKED_LIST" onClose={() => setShowInfo(false)} />}
        </div>
    )
}
