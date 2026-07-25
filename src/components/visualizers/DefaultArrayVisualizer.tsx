
import { useMemo } from 'react'
import { ArrayBox } from '../3d/ArrayBox'
import { Text as ThreeText } from '@react-three/drei'
import type { Step } from '../../types/Algorithm'

interface DefaultArrayVisualizerProps {
    visualData: any
    steps: Step[]
    currentStepIndex: number
}

export const DefaultArrayVisualizer = ({ visualData, steps, currentStepIndex }: DefaultArrayVisualizerProps) => {

    const currentStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null

    // Derived Grid State for Mutations
    const derivedGrid = useMemo(() => {
        if (!Array.isArray(visualData)) return null

        // Detect Matrix Mode: Single argument which is a 2D array
        const isMatrix = visualData.length === 1 && Array.isArray(visualData[0]) && Array.isArray(visualData[0][0])

        if (isMatrix) {
            // Deep copy the matrix (visualData[0])
            const matrix = (visualData[0] as any[][]).map(row => [...row])
            const gridWrapper = [matrix]

            if (!steps.length || currentStepIndex < 0) return gridWrapper

            for (let i = 0; i <= currentStepIndex; i++) {
                const s = steps[i]
                if (s.type === 'MUTATE_GRID' && s.indices && s.indices.length === 2 && s.value !== undefined) {
                    const [r, c] = s.indices
                    if (gridWrapper[0][r] && gridWrapper[0][r][c] !== undefined) {
                        gridWrapper[0][r][c] = s.value
                    }
                }
            }
            return gridWrapper
        }

        // Standard Multi-Array or Single-Array (Non-Matrix)
        if (visualData.length > 0 && !Array.isArray(visualData[0])) {
            // 1D Array of primitives - just shallow copy
            return [...visualData]
        }

        const grid = (visualData as any[][]).map(row => [...row])
        return grid
    }, [visualData, steps, currentStepIndex])

    const getHighlight = (index: number) => {
        if (!currentStep || !currentStep.indices) return false
        return currentStep.indices.includes(index)
    }

    const getBoxColor = (r: number, c: number) => {
        // DETECT MODE based on visualData
        // Helper: Check if Multi-Row (Median Mode)
        // Median data is `[number[], number[]]` (Array of Arrays of Primitives) -> visualData.length > 0 && Array.isArray(visualData[0]) && !Array.isArray(visualData[0][0])
        // This distinguishes from Matrix (Array of Array of Primitives is... wait. Matrix is `[[1,2],[3,4]]` - Array of Array. 
        // Median is `[[1,3], [2]]` - Array of Array. 
        // Logic in derivedGrid:
        // isMatrix = visualData.length === 1 && Array.isArray(visualData[0]) && Array.isArray(visualData[0][0]) -> `[[[1,2], [3,4]]]`? No.

        // Let's re-read derivedGrid logic:
        // isMatrix = visualData.length === 1 && Array.isArray(visualData[0]) && Array.isArray(visualData[0][0])
        // Input `[[1,0...], [1,0...]]` for Islands is passed as SINGLE argument? No.
        // Islands input: `grid` (Array of Arrays). `run(grid)`. `visualData` = `grid`.
        // `visualData` for Islands is `[[1,0],[0,1]]`. length=2. Array[0] is `[1,0]`. Array[0][0] is string.
        // So `isMatrix` detection in derivedGrid (lines 22) seems to expect `[grid]`.
        // BUT Islands visualizer uses `IslandGridVisualizer`. `DefaultArrayVisualizer` detects isMatrix?
        // Let's rely on the structure passed to THIS component.
        // If it's Median, it's 2 rows. `val` is number.

        const isMultiRow = Array.isArray(visualData) && visualData.length > 0 && Array.isArray(visualData[0])

        // STRICT MEDIAN GUARD
        // If we are in Multi-Row mode (implied Median), we suppress default green logic.
        if (isMultiRow) {
            // Check for phase property
            const phase = (currentStep as any)?.phase
            if (phase === 'valid') {
                // If Valid phase, allow Green/Focus colors
                return '#22c55e' // Green
            }
            if (phase === 'search') {
                // During search, strictly NO Green.
                // Allow highlights if specified (e.g. Cyan for rowHighlights, Yellow for pointer)
                // BUT do NOT fall through to Value-based Green.

                // 1. Highlight from Step (Pointer or Row)
                if (currentStep?.rowHighlights?.[r]?.includes(c)) return '#00ffff' // Cyan
                if (currentStep?.indices?.[0] === r && currentStep?.indices?.[1] === c) return '#fbbf24' // Yellow (Pointer)

                return undefined // Neutral
            }
            // If phase is undefined (e.g. Number of Islands), fall through to default logic.
        }

        // 1. Highlight from Step
        if (currentStep) {
            if (currentStep.indices) {
                let shouldHighlight = false

                // Reuse simple matrix var if needed, or re-detect. 
                // Existing logic:
                if (isMatrix) {
                    // Strict [row, col] match
                    // ... (existing)
                    if (currentStep.indices[0] === r && currentStep.indices[1] === c) shouldHighlight = true
                } else {
                    // 1D Array Mode
                    if (currentStep.indices.includes(c)) shouldHighlight = true
                }

                if (shouldHighlight) {
                    if (currentStep.type === 'POINTER') return '#fbbf24' // Yellow for scan/check
                    if (currentStep.type === 'FOUND') return '#22c55e' // Green for Land Found
                    if (currentStep.type === 'MUTATE_GRID') return '#3b82f6' // Blue for Water/Sunken
                    if (currentStep.type === 'DFS_CALL') return '#a855f7' // Purple for DFS
                }
            }
        }

        // 2. Base Color based on Value - REMOVED
        // Island-specific logic (1=green, 0=blue) moved to IslandGridVisualizer.
        // DefaultArrayVisualizer should NOT apply color based on raw value to prevent leakage.

        // 3. Default row highlights (Cyan)
        if (currentStep?.rowHighlights?.[r]?.includes(c)) return '#00ffff'

        return undefined
    }

    // Render Logic
    const rawData = derivedGrid || visualData
    if (!Array.isArray(rawData)) return null

    const isMatrix = rawData.length === 1 && Array.isArray(rawData[0]) && Array.isArray(rawData[0][0])

    if (isMatrix) {
        // MATRIX MODE (2D Grid)
        const matrix = rawData[0] as any[][]
        return (
            <group>
                {/* Centered Grid Container */}
                <group position={[
                    -(matrix[0].length * 2.5) / 2 + 1.25, // Center X
                    0, // Center Y (relative)
                    -(matrix.length * 2.5) / 2 + 1.25  // Center Z
                ]}>
                    {matrix.map((row, r) => (
                        row.map((val: string | number, c: number) => (
                            <ArrayBox
                                key={`${r}-${c}`}
                                index={c}
                                value={val}
                                position={[c * 2.5, 0, r * 2.5]}
                                isOpen={false}
                                isHighlighted={
                                    (currentStep?.indices?.[0] === r && currentStep?.indices?.[1] === c) ||
                                    (currentStep?.type === 'POINTER' && currentStep?.indices?.[0] === r && currentStep?.indices?.[1] === c)
                                }
                                overrideColor={getBoxColor(r, c)}
                                valuePlacement="top"
                            />
                        ))
                    ))}
                </group>

                {/* Label axes */}
                <ThreeText position={[-((matrix[0].length * 2.5) / 2 + 1), 0, -((matrix.length * 2.5) / 2 + 1)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} color="#94a3b8">
                    (0,0)
                </ThreeText>
            </group>
        )
    } else {
        // STANDARD ARRAY / MULTI-ARRAY MODE
        return (
            <group>
                {/* Check if multi-row or flat */}
                {(rawData as any[][]).length > 0 && Array.isArray(rawData[0]) && Array.isArray((rawData as any[])[0]) ? (
                    // Multi-Row Case (e.g. Median finding - 2 separate arrays)
                    // Wait, logic above checks if visualData is array of primitives, but derivedGrid might wrap it?
                    // Let's stick to the visualData / derivedGrid shape.
                    // If derivedGrid returned [...visualData] (1D), then rawData[0] is primitive.
                    // The condition: (rawData as any[][]).length > 0 && Array.isArray(rawData[0]) 
                    // This handles 2D array of primitives (Multi-Row) vs 1D array of primitives.
                    (rawData as any[]).map((row: any[], rowIndex: number) => (
                        <group key={rowIndex} position={[-(row.length * 2.5) / 2 + 1.25, (rawData.length - rowIndex * 2.5), 0]}>
                            <ThreeText position={[-2, 0, 0]} fontSize={0.4} color="#64748b" anchorX="right">{rowIndex}</ThreeText>
                            {row.map((val: number | string, c: number) => (
                                <ArrayBox
                                    key={`${rowIndex}-${c}`}
                                    index={c}
                                    value={val}
                                    position={[c * 2.5, 0, 0]}
                                    isOpen={false}
                                    isHighlighted={
                                        (currentStep?.rowHighlights?.[rowIndex]?.includes(c)) ||
                                        (currentStep?.indices?.[0] === rowIndex && currentStep?.indices?.[1] === c)
                                    }
                                    overrideColor={getBoxColor(rowIndex, c)}
                                />
                            ))}
                        </group>
                    ))
                ) : (
                    // Single Flat Array
                    (rawData as any[]).map((val: number | string, i: number) => (
                        <ArrayBox
                            key={i}
                            index={i}
                            value={val}
                            position={[i * 2.5 - (rawData.length * 2.5) / 2, 0, 0]}
                            isOpen={false}
                            isHighlighted={getHighlight(i)}
                            overrideColor={getBoxColor(0, i)}
                        />
                    ))
                )}
            </group>
        )
    }
}
