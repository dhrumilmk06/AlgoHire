import { useState, useRef } from 'react'
import CameraControls from '../3d/CameraControls'
import { Canvas } from '@react-three/fiber'
import { ArrayBox } from '../3d/ArrayBox'
import { CodeWindow } from '../ui/CodeWindow'
import { InfoModal } from '../InfoModal'
import { Info, Cpu } from 'lucide-react'
import { Text, Line } from '@react-three/drei'

const ACCESS_CODE_SNIPPET = `// O(1) Access
int value = array[index]; // Direct Indexing
return value;`

const SEARCH_CODE_SNIPPET = `// O(n) Search
for (int i = 0; i < n; i++) {
    if (array[i] == target) return i;
}
return -1;`

export const ArrayLevel = ({ showGrid }: { showGrid: boolean }) => {
    const [data, setData] = useState([10, 25, 40, 5, 8, 99, 12, 33, 41, 7])
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)
    const cameraControlsRef = useRef<any>(null)

    // Code Window State
    const [codeSnippet, setCodeSnippet] = useState(ACCESS_CODE_SNIPPET)
    const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
    const [codeTitle, setCodeTitle] = useState('O(1) Access')
    const [showCode, setShowCode] = useState(false)

    // Info Modal State
    const [showInfo, setShowInfo] = useState(false)
    const [inputStr, setInputStr] = useState('10, 25, 40, 5, 8, 99, 12, 33, 41, 7')
    const [nameInput, setNameInput] = useState('arr')
    const [baseInput, setBaseInput] = useState('1000')

    // Memory Simulation State
    const [showMemoryView, setShowMemoryView] = useState(false)
    const [arrayName, setArrayName] = useState('arr')
    const [baseAddress, setBaseAddress] = useState(1000)
    const elementSize = 4
    const [accessMode, setAccessMode] = useState<'INDEX' | 'ADDRESS'>('INDEX')

    const accessInputRef = useRef<HTMLInputElement>(null)

    // Error Feedback
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const errorTimeoutRef = useRef<any>(null)

    const triggerError = (msg: string) => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current)
        setErrorMsg(msg)
        errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 3000)
    }

    const handleLoadData = () => {
        // Use separate inputs
        const newName = nameInput.trim() || 'arr'
        let newBase = parseInt(baseInput)
        if (isNaN(newBase)) newBase = 1000

        const arr = inputStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
        // Limit to 12 items
        const limitedArr = arr.slice(0, 12)
        if (limitedArr.length > 0) {
            setData(limitedArr)
            setArrayName(newName)
            setBaseAddress(newBase)
            setOpenIndex(null)
            setHighlightedIndex(null)
            setHighlightedLine(null)
            setIsAnimating(false)
            setErrorMsg(null)
        }
    }


    const handleAccess = async (index: number) => {
        if (index < 0 || index >= data.length) return
        setIsAnimating(true)
        setOpenIndex(null)
        setHighlightedIndex(null)

        // Setup Code Window
        setCodeTitle('O(1) Access')
        setCodeSnippet(ACCESS_CODE_SNIPPET)

        // Step 1: Highlight variable declaration (Line 2)
        setHighlightedLine(2)

        // Move Camera
        await cameraControlsRef.current?.setLookAt(index * 2 + 2, 3, 5, index * 2, 0, 0, true)

        // Step 2: Access & Return (Simulate instant access)
        setOpenIndex(index)
        setHighlightedIndex(index)
        setHighlightedLine(3)
        await new Promise(r => setTimeout(r, 1000))

        setHighlightedLine(null)
        setIsAnimating(false)
    }

    const handleSearch = async (target: number) => {
        setIsAnimating(true)
        setOpenIndex(null)
        setHighlightedIndex(null)
        await cameraControlsRef.current?.setLookAt(10, 5, 15, 10, 0, 0, true)

        // Setup Code Window
        setCodeTitle('O(n) Search')
        setCodeSnippet(SEARCH_CODE_SNIPPET)

        for (let i = 0; i < data.length; i++) {
            // Highlight Loop Check (Line 2)
            setHighlightedLine(2)
            setHighlightedIndex(i)
            await new Promise(r => setTimeout(r, 400))

            // Highlight If check (Line 3)
            setHighlightedLine(3)
            if (data[i] === target) {
                setOpenIndex(i)
                setHighlightedLine(3) // Return i
                await new Promise(r => setTimeout(r, 1000))
                setHighlightedLine(null)
                setIsAnimating(false)
                return
            }
        }
        // Return -1
        setHighlightedLine(5)
        await new Promise(r => setTimeout(r, 500))
        setHighlightedLine(null)
        setIsAnimating(false)
    }

    return (
        <div className="absolute inset-0 left-20 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex-1 relative w-full">
                <Canvas camera={{ position: [10, 5, 15], fov: 50 }}>
                    <CameraControls
                        ref={cameraControlsRef}
                        makeDefault
                        dollySpeed={1.5}
                        azimuthRotateSpeed={1.5}
                        polarRotateSpeed={1.5}
                        truckSpeed={2.5}
                        smoothTime={0.25} // Equivalent to damping
                    />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1} />
                    {showGrid && <gridHelper args={[50, 50, '#004444', '#002222']} position={[0, -2, 0]} />}

                    {/* Memory Overlays */}
                    {showMemoryView && (
                        <>
                            {/* Array Pointer: arr -> 1000 */}
                            <group position={[-3, 3, 0]}>
                                <Text
                                    fontSize={0.8}
                                    color="#fbbf24" // Amber-400
                                    anchorX="right"
                                    anchorY="middle"
                                >
                                    {arrayName}
                                </Text>
                                {/* Arrow shaft */}
                                <mesh position={[1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                                    <cylinderGeometry args={[0.05, 0.05, 1.5]} />
                                    <meshBasicMaterial color="#fbbf24" />
                                </mesh>
                                {/* Arrow head */}
                                <mesh position={[1.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                                    <coneGeometry args={[0.15, 0.4, 8]} />
                                    <meshBasicMaterial color="#fbbf24" />
                                </mesh>
                                <Text
                                    position={[2.5, 0, 0]}
                                    fontSize={0.6}
                                    color="#4ade80" // Green
                                    anchorX="left"
                                    anchorY="middle"
                                >
                                    {baseAddress}
                                </Text>
                                {/* Connecting line to Index 0 */}
                                <Line
                                    points={[[1.8, 0, 0], [3, -2, 0]]} // Adjust based on alignment
                                    color="#fbbf24"
                                    lineWidth={1}
                                    transparent
                                    opacity={0.5}
                                />
                            </group>

                            {/* Contiguous Block Indicator */}
                            <group position={[((data.length - 1) * 2) / 2, -3, 0]}>
                                {/* Horizontal Bracket Line */}
                                <mesh position={[0, -0.1, 0]}>
                                    <boxGeometry args={[data.length * 2, 0.05, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
                                </mesh>
                                {/* Left Vertical Tick */}
                                <mesh position={[-(data.length * 2) / 2, 0.2, 0]}>
                                    <boxGeometry args={[0.05, 0.6, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
                                </mesh>
                                {/* Right Vertical Tick */}
                                <mesh position={[(data.length * 2) / 2, 0.2, 0]}>
                                    <boxGeometry args={[0.05, 0.6, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
                                </mesh>
                                <Text
                                    position={[0, -0.8, 0]}
                                    fontSize={0.5}
                                    color="#94a3b8"
                                    anchorX="center"
                                    anchorY="top"
                                >
                                    Contiguous Memory Block
                                </Text>
                            </group>
                        </>
                    )}

                    {/* Render Array Blocks */}
                    {data.map((value, index) => (
                        <ArrayBox
                            key={index}
                            index={index}
                            value={value}
                            position={[index * 2, 0, 0]}
                            isOpen={index === openIndex}
                            isHighlighted={index === highlightedIndex}
                            address={baseAddress + (index * elementSize)}
                            showAddress={showMemoryView}
                        />
                    ))}
                </Canvas>
            </div>

            {/* UI Dock (Bottom) */}
            <div className="w-full bg-slate-950 border-t border-slate-800 z-50 flex-none p-4 flex justify-between pointer-events-auto">
                {/* Left: Title */}
                <div>
                    <h1 className="text-xl font-bold text-cyan-400 tracking-wider uppercase">ARRAY VISUALIZER</h1>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Size: {data.length} | O(1) Access</div>
                </div>

                {/* Center: Input */}
                <div className="flex items-center gap-2">
                    <input
                        className="bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg font-mono text-sm w-20 outline-none focus:border-cyan-500 text-center"
                        placeholder="Name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        title="Array Name"
                    />
                    <span className="text-slate-600 font-bold">@</span>
                    <input
                        className="bg-slate-950 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg font-mono text-sm w-20 outline-none focus:border-cyan-500 text-center"
                        placeholder="Base"
                        value={baseInput}
                        onChange={(e) => setBaseInput(e.target.value)}
                        title="Base Address"
                    />
                    <span className="text-slate-600 font-bold">:</span>
                    <input
                        className="bg-slate-950 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg font-mono text-sm w-48 outline-none focus:border-cyan-500"
                        placeholder="10, 20, 30..."
                        value={inputStr}
                        onChange={(e) => setInputStr(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLoadData()}
                    />
                    <button
                        onClick={handleLoadData}
                        className="bg-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded hover:bg-slate-700 transition-colors text-sm font-bold uppercase tracking-wider"
                    >
                        LOAD
                    </button>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-6">
                    {/* Access Control */}
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            {/* Access Mode Toggle (Small) */}
                            {showMemoryView && (
                                <button
                                    onClick={() => setAccessMode(prev => prev === 'INDEX' ? 'ADDRESS' : 'INDEX')}
                                    className="text-[10px] text-slate-400 hover:text-cyan-400 uppercase tracking-tighter mb-1 text-right"
                                >
                                    {accessMode === 'INDEX' ? 'By Index' : 'By Addr'}
                                </button>
                            )}
                            <div className="flex items-center gap-2">
                                <input
                                    className="w-20 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                                    type="number"
                                    placeholder={accessMode === 'ADDRESS' && showMemoryView ? "Addr" : "Idx"}
                                    ref={accessInputRef}
                                />
                                <button
                                    onClick={() => {
                                        const inputEl = accessInputRef.current;
                                        if (!inputEl) return;
                                        const val = parseInt(inputEl.value);
                                        if (isNaN(val)) return;

                                        if (showMemoryView && accessMode === 'ADDRESS') {
                                            // Address Logic
                                            // index = (addr - base) / size
                                            const offset = val - baseAddress;
                                            if (offset < 0 || offset % elementSize !== 0) {
                                                triggerError(`Invalid Address. Must be ${baseAddress} + k*${elementSize}.`);
                                                return;
                                            }
                                            const idx = offset / elementSize;
                                            if (idx < 0 || idx >= data.length) {
                                                triggerError('Address Out of Bounds');
                                                return;
                                            }
                                            handleAccess(idx);
                                        } else {
                                            // Index Logic
                                            if (val < 0 || val >= data.length) {
                                                // Let handleAccess handle bounds, or do it here
                                                if (val < 0 || val >= data.length) {
                                                    triggerError('Index Out of Bounds');
                                                    return;
                                                }
                                            }
                                            handleAccess(val);
                                        }
                                    }}
                                    disabled={isAnimating}
                                    className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    Access
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-800"></div>

                    {/* Search Control */}
                    <div className="flex items-center gap-2">
                        <input
                            className="w-16 bg-slate-900 text-center text-sm text-white p-2 rounded border border-slate-700 outline-none focus:border-cyan-500 transition-colors font-mono"
                            type="number"
                            placeholder="Val"
                            id="search-input"
                        />
                        <button
                            onClick={() => {
                                const val = parseInt((document.getElementById('search-input') as HTMLInputElement).value);
                                if (!isNaN(val)) handleSearch(val);
                            }}
                            disabled={isAnimating}
                            className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/50 rounded hover:bg-green-600/40 transition-colors text-sm font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Far Right: Status/Toggle */}
                <div className="flex items-center gap-4">
                    {/* Error Message Toast */}
                    {errorMsg && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-4 py-2 rounded shadow-lg pointer-events-none text-sm font-bold animate-pulse">
                            {errorMsg}
                        </div>
                    )}

                    <button
                        onClick={() => setShowMemoryView(!showMemoryView)}
                        className={`p-2 rounded-lg transition-colors border ${showMemoryView ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}
                        title="Toggle Memory View"
                    >
                        <Cpu size={20} />
                    </button>

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
                <div className="absolute top-5 right-5 z-20 pointer-events-auto">
                    <CodeWindow
                        code={codeSnippet}
                        highlightedLine={highlightedLine}
                        title={codeTitle}
                        onClose={() => setShowCode(false)}
                    />
                </div>
            )}

            {showInfo && (
                <InfoModal
                    type="ARRAY"
                    onClose={() => setShowInfo(false)}
                />
            )}
        </div>
    )
}
