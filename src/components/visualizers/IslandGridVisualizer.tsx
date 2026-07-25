
import { Html, Text as ThreeText } from '@react-three/drei'
import { ArrayBox } from '../3d/ArrayBox'
import type { GridSnapshot, CellVisualState } from '../../core/visual/VisualSnapshot'

interface IslandGridVisualizerProps {
    snapshot?: GridSnapshot
}

export const IslandGridVisualizer = ({ snapshot }: IslandGridVisualizerProps) => {
    // GUARD: If no snapshot is provided (e.g. still loading or error), render nothing
    if (!snapshot) {
        return null;
    }

    const { grid, islandCount } = snapshot;

    // Helper for colors based on Visual State
    const getBoxColor = (visual: CellVisualState) => {
        switch (visual) {
            case 'land': return '#22c55e';    // GREEN
            case 'water': return '#3b82f6';   // BLUE
            case 'visited': return '#facc15'; // YELLOW
            case 'active': return '#facc15';  // YELLOW (Active)
            default: return '#1e3a8a';        // Fallback Dark Blue
        }
    }

    return (
        <>
            <group>
                {/* Centered Grid Container */}
                <group position={[
                    -(grid[0]?.length * 2.5 || 0) / 2 + 1.25,
                    0,
                    -(grid.length * 2.5) / 2 + 1.25
                ]}>
                    {grid.map((row, r) => (
                        row.map((cell, c) => (
                            <ArrayBox
                                key={`${r}-${c}`}
                                index={c}
                                value={cell.value}
                                position={[c * 2.5, 0, r * 2.5]}
                                isOpen={false}
                                isHighlighted={cell.visual === 'active'}
                                overrideColor={getBoxColor(cell.visual)}
                                valuePlacement="top"
                            />
                        ))
                    ))}
                </group>

                {/* Label axes */}
                <ThreeText position={[-((grid[0]?.length * 2.5 || 0) / 2 + 1), 0, -((grid.length * 2.5) / 2 + 1)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.5} color="#94a3b8">
                    (0,0)
                </ThreeText>
            </group>


            <Html position={[0, 0, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
                {/* Centered HUD Container - Using fixed width/position to stay aligned */}
                <div style={{ transform: 'translate3d(-50%, -350px, 0)', width: '300px' }} className="flex flex-col items-center">
                    <div className="bg-slate-900/90 border-2 border-slate-700 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-1">
                        <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Islands Found</h3>
                        <div className="text-5xl font-mono font-bold text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.5)]">
                            {islandCount}
                        </div>
                    </div>
                </div>
            </Html>
        </>
    )
}
