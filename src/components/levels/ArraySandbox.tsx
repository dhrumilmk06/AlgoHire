import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import CameraControls from '../3d/CameraControls'
import { ArrayBox } from '../3d/ArrayBox'
import { Text, Line } from '@react-three/drei'
import { Cpu } from 'lucide-react'

type ArrayItem = {
    id: string
    value: number
}

// Simple ID generator to avoid external dependencies
const generateId = () => Math.random().toString(36).substr(2, 9)

// Generate initial data with stable IDs
const generateInitialData = (): ArrayItem[] => [
    { id: generateId(), value: 10 },
    { id: generateId(), value: 20 },
    { id: generateId(), value: 30 }
]

export default function ArraySandbox({ showGrid }: { showGrid: boolean }) {
    // ---------------------------------------------------------
    // 1. STATE
    // ---------------------------------------------------------
    const [data, setData] = useState<ArrayItem[]>(generateInitialData)
    const [code, setCode] = useState<string>('insert(0, 10)\ninsert(1, 20)\nupdate(1, 55)\n// delete(0)')
    const [logs, setLogs] = useState<string[]>([])

    // Memory Mode State
    const [memoryMode, setMemoryMode] = useState(false)
    const baseAddress = 1000
    const elementSize = 4
    const arrayName = 'arr'

    // Resizable Sidebar State
    const [sidebarWidth, setSidebarWidth] = useState(450)
    const [isResizing, setIsResizing] = useState(false)

    // ---------------------------------------------------------
    // 2. RESIZE LOGIC
    // ---------------------------------------------------------
    const startResizing = useCallback(() => setIsResizing(true), [])
    const stopResizing = useCallback(() => setIsResizing(false), [])

    const resize = useCallback((mouseMoveEvent: MouseEvent) => {
        if (isResizing) {
            // Calculate new width based on mouse position relative to left edge (80px offset for main sidebar)
            const newWidth = mouseMoveEvent.clientX - 80
            if (newWidth >= 300 && newWidth <= window.innerWidth * 0.6) {
                setSidebarWidth(newWidth)
            }
        }
    }, [isResizing])

    useEffect(() => {
        window.addEventListener("mousemove", resize)
        window.addEventListener("mouseup", stopResizing)
        return () => {
            window.removeEventListener("mousemove", resize)
            window.removeEventListener("mouseup", stopResizing)
        }
    }, [resize, stopResizing])

    // ---------------------------------------------------------
    // 3. LOGIC (The "Mini-Compiler")
    // ---------------------------------------------------------
    const runCode = async () => {
        setLogs([])
        // Reset to initial state logic could differ, but here we just start fresh based on "run"
        let currentData: ArrayItem[] = generateInitialData()
        setData([...currentData]) // Reset visuals immediately

        const lines = code.split('\n')
        const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
        const addLog = (msg: string) => setLogs(prev => [...prev, msg])

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('//')) continue

            try {
                // Support both `clear` (no parens) and `clear()` (with parens) roughly, 
                // but regex below expects parens: `func ( args )`
                // Let's make the regex more flexible or just stick to standard.
                const match = trimmed.match(/^(\w+)\s*\((.*)\)/)

                if (!match) {
                    // Check for simple 'clear' without parens if we want to be nice, 
                    // but prompt spec used `clear()`. 
                    throw new Error(`Syntax error on line ${lineIndex + 1}`)
                }

                const [, funcRaw, argsStr] = match
                const func = funcRaw.toLowerCase() // Case insensitive function name
                const args = argsStr.split(',').map(s => s.trim()).filter(s => s !== '')

                await delay(500)

                if (func === 'insert') {
                    if (args.length !== 2) throw new Error(`insert expects 2 args`)
                    const idx = parseInt(args[0])
                    const val = parseInt(args[1])
                    if (isNaN(idx) || isNaN(val)) throw new Error(`Invalid numbers`)

                    addLog(`> 🟢 Command: insert(${idx}, ${val})`)
                    await delay(500)

                    addLog(`> 🔍 Step 1: Checking index bounds [0..${currentData.length}]... OK`)
                    if (idx < 0 || idx > currentData.length) {
                        addLog(`> ⚠️ Warning: Index ${idx} out of bounds. Appending.`)
                        currentData.push({ id: generateId(), value: val })
                    } else {
                        await delay(500)
                        addLog(`> 🚚 Step 2: Shifting elements from index ${idx} to right...`)
                        await delay(500)
                        currentData.splice(idx, 0, { id: generateId(), value: val })
                        addLog(`> 💾 Step 3: Writing value ${val} to address [${idx}]`)
                    }
                    setData([...currentData]) // Update visuals
                    addLog(`> ✅ Success.`)
                }
                else if (func === 'delete') {
                    if (args.length !== 1) throw new Error(`delete expects 1 arg`)
                    const idx = parseInt(args[0])
                    if (isNaN(idx)) throw new Error(`Invalid number`)

                    addLog(`> 🔴 Command: delete(${idx})`)
                    await delay(500)

                    if (idx < 0 || idx >= currentData.length) {
                        throw new Error(`Index ${idx} out of bounds`)
                    }

                    addLog(`> 🔍 Step 1: target found at index ${idx}.`)
                    await delay(500)
                    addLog(`> 🚚 Step 2: Shifting remaining elements left to fill gap...`)
                    await delay(500)

                    // Actual Logic: Remove item. The Render loop handles the "shift" visually 
                    // because index prop changes for subsequent items.
                    currentData.splice(idx, 1)

                    addLog(`> 🗑️ Step 3: Releasing memory at last index.`)

                    setData([...currentData]) // Update visuals
                    addLog(`> ✅ Success.`)
                }
                else if (func === 'update') {
                    if (args.length !== 2) throw new Error(`update expects 2 args`)
                    const idx = parseInt(args[0])
                    const val = parseInt(args[1])

                    addLog(`> 🔵 Command: update(${idx}, ${val})`)
                    await delay(500)

                    if (idx < 0 || idx >= currentData.length) {
                        throw new Error(`Index ${idx} out of bounds`)
                    }
                    addLog(`> 🔍 Step 1: Locating address [${idx}]...`)
                    await delay(500)

                    // Immutably update the item value
                    currentData[idx] = { ...currentData[idx], value: val }

                    addLog(`> 💾 Step 2: Overwriting value with ${val}...`)

                    setData([...currentData]) // Update visuals
                    addLog(`> ✅ Success.`)
                }
                else if (func === 'clear') {
                    if (args.length !== 0) throw new Error(`clear expects 0 args`)

                    addLog(`> 🧹 Command: clear()`)
                    await delay(500)

                    currentData = []
                    addLog(`> 🗑️ Array cleared. Memory released.`)
                    setData([...currentData])
                    await delay(500)
                }
                else {
                    throw new Error(`Unknown function: ${funcRaw}`)
                }

            } catch (err: any) {
                addLog(`> ❌ ERROR: ${err.message}`)
                break; // Stop execution on error
            }
        }

        await delay(500)
        addLog('--- Execution Finished ---')
    }

    const lineNumbers = code.split('\n').map((_, i) => i + 1)

    // ---------------------------------------------------------
    // 4. RENDER
    // ---------------------------------------------------------
    return (
        <div className={`absolute inset-0 left-20 flex flex-row bg-slate-950 overflow-hidden ${isResizing ? 'cursor-col-resize select-none' : ''}`}>

            {/* LEFT PANEL: Resizable Editor */}
            <div
                style={{ width: sidebarWidth }}
                className="flex flex-col border-r border-slate-800 bg-slate-950 z-10 shadow-xl shrink-0"
            >
                {/* Header */}
                <div className="h-14 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/50">
                    <h2 className="text-cyan-400 font-bold tracking-wider text-sm">ARRAY SANDBOX</h2>
                    <div className="flex items-center gap-2">
                        {/* Memory Mode Toggle */}
                        <button
                            onClick={() => setMemoryMode(!memoryMode)}
                            className={`p-1.5 rounded transition-all border ${memoryMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-white'}`}
                            title="Toggle Memory Mode"
                        >
                            <Cpu size={16} />
                        </button>
                        <button
                            onClick={runCode}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                        >
                            RUN CODE
                        </button>
                    </div>
                </div>

                {/* Code Area */}
                <div className="flex-1 relative flex overflow-hidden group">
                    {/* Line Numbers Strip */}
                    <div className="w-10 text-slate-600 text-right pr-3 pt-4 text-xs font-mono bg-slate-900/50 select-none border-r border-slate-800/10 h-full">
                        {lineNumbers.map(n => (
                            <div key={n} className="leading-6 opacity-50">{n}</div>
                        ))}
                    </div>

                    {/* Textarea */}
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="flex-1 bg-transparent text-slate-300 font-mono text-sm p-4 pt-4 leading-6 outline-none resize-none selection:bg-cyan-500/30"
                        spellCheck={false}
                        placeholder="// write your code..."
                    />
                </div>

                {/* Console */}
                <div className="h-40 border-t border-slate-800 bg-black/80 p-3 overflow-y-auto font-mono text-xs shadow-inner">
                    <div className="text-slate-500 mb-2 uppercase tracking-wide text-[10px] font-bold">Console Output</div>
                    <div className="flex flex-col gap-1">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.startsWith('ERROR') ? 'text-red-400' : 'text-green-400'} border-l-2 ${log.startsWith('> ❌') ? 'border-red-900' : 'border-green-900'} pl-2`}>
                                {log === '--- Execution Finished ---' ? <span className="text-slate-600 italic">-- done --</span> : log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DRAG HANDLE */}
            <div
                className="w-1 cursor-col-resize bg-slate-800 hover:bg-cyan-500 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={startResizing}
            >
                {/* Visual Grip Indicator (Matches user image) */}
                <div className="h-8 w-0.5 bg-slate-600 group-hover:bg-cyan-200 rounded-full" />
            </div>

            {/* RIGHT PANEL: 3D Canvas */}
            <div className="flex-1 relative bg-gradient-to-b from-slate-900 to-slate-950 min-w-0">
                <Canvas camera={{ position: [8, 5, 12], fov: 50 }}>
                    <CameraControls
                        makeDefault
                        dollySpeed={1.5}
                        azimuthRotateSpeed={1.5}
                        polarRotateSpeed={1.5}
                        truckSpeed={2.5}
                        smoothTime={0.25}
                    />

                    {/* Grid Floor */}
                    {showGrid && <gridHelper args={[50, 50, 0x334155, 0x1e293b]} position={[0, -2, 0]} />}

                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 10, 5]} intensity={1} />

                    {/* MEMORY MODE VISUALS */}
                    {memoryMode && data.length > 0 && (
                        <group>
                            {/* Base Pointer */}
                            <group position={[-2.5, 2.5, 0]}>
                                <Text
                                    fontSize={0.6}
                                    color="#fbbf24" // Amber-400
                                    anchorX="right"
                                    anchorY="middle"
                                >
                                    {arrayName} → {baseAddress}
                                </Text>
                                {/* Arrow to Index 0 */}
                                <Line
                                    points={[[0.5, 0, 0], [2, -1.5, 0]]} // Rough diagonal to 0,0,0
                                    color="#fbbf24"
                                    lineWidth={1}
                                    transparent
                                    opacity={0.6}
                                />
                            </group>

                            {/* Contiguous Block Indicator (Bracket) */}
                            <group position={[((data.length - 1) * 2.0) / 2, -2.5, 0]}>
                                {/* Horizontal Line */}
                                <mesh position={[0, 0, 0]}>
                                    <boxGeometry args={[data.length * 2.0, 0.05, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
                                </mesh>
                                {/* Left Tick */}
                                <mesh position={[-(data.length * 2.0) / 2, 0.25, 0]}>
                                    <boxGeometry args={[0.05, 0.5, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
                                </mesh>
                                {/* Right Tick */}
                                <mesh position={[(data.length * 2.0) / 2, 0.25, 0]}>
                                    <boxGeometry args={[0.05, 0.5, 0.05]} />
                                    <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
                                </mesh>
                                <Text
                                    position={[0, -0.6, 0]}
                                    fontSize={0.4}
                                    color="#94a3b8"
                                    anchorX="center"
                                    anchorY="top"
                                >
                                    Contiguous Block
                                </Text>
                            </group>
                        </group>
                    )}

                    {/* Array Data */}
                    {data.map((item, i) => (
                        <ArrayBox
                            key={item.id} // STABLE KEY
                            index={i}      // DYNAMIC INDEX
                            value={item.value}
                            position={[i * 2.0, 0, 0]} // STRICT INDEX POSITIONING
                            isOpen={false}
                            isHighlighted={false}
                            address={baseAddress + (i * elementSize)}
                            showAddress={memoryMode}
                        />
                    ))}
                </Canvas>
            </div>
        </div>
    )
}
