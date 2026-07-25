import { useState } from 'react'
import { MousePointer2, Move, ZoomIn, X, HelpCircle, Grid } from 'lucide-react'

type NavigationControlsProps = {
    showGrid: boolean
    onToggleGrid: () => void
}

export const NavigationControls = ({ showGrid, onToggleGrid }: NavigationControlsProps) => {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) {
        return (
            <div className="absolute bottom-32 right-8 flex flex-col gap-2 z-50 pointer-events-auto items-end">
                {/* Minimized Grid Toggle */}
                <button
                    onClick={onToggleGrid}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(8,145,178,0.2)]
                        ${showGrid
                            ? 'bg-cyan-900/40 border-cyan-500/30 text-cyan-400 hover:bg-cyan-800/60'
                            : 'bg-black/60 border-gray-600/30 text-gray-500 hover:text-cyan-400'
                        }
                    `}
                    title="Toggle Grid"
                >
                    <Grid size={18} />
                </button>

                <button
                    onClick={() => setIsVisible(true)}
                    className="w-10 h-10 rounded-full bg-cyan-900/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-800/60 hover:scale-110 transition-all duration-300 shadow-[0_0_15px_rgba(8,145,178,0.2)]"
                    title="Show Navigation Controls"
                >
                    <HelpCircle size={20} />
                </button>
            </div>
        )
    }

    return (
        <div className="absolute bottom-32 right-8 flex flex-col gap-3 z-50 pointer-events-auto select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-black/90 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4 shadow-[0_0_30px_rgba(8,145,178,0.2)] w-64 relative group">
                {/* Header Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button
                        onClick={onToggleGrid}
                        className={`p-1 transition-colors ${showGrid ? 'text-cyan-400' : 'text-gray-600 hover:text-cyan-400'}`}
                        title="Toggle Grid"
                    >
                        <Grid size={14} />
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-cyan-600/50 hover:text-cyan-400 transition-colors p-1"
                        title="Minimize"
                    >
                        <X size={14} />
                    </button>
                </div>

                <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3 border-b border-cyan-500/20 pb-2 flex items-center gap-2">
                    <span>Navigation</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-500/10">SYS_V2</span>
                </h3>

                <div className="flex flex-col gap-3">
                    {/* Rotate */}
                    <div className="flex items-center gap-3 text-sm group/item">
                        <div className="w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover/item:border-cyan-500/40 transition-colors">
                            <MousePointer2 size={16} className="text-cyan-500/80" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-200 font-bold text-xs uppercase">Left Click + Drag</span>
                            <span className="text-cyan-600/80 text-[10px] uppercase tracking-wide">Rotate Camera</span>
                        </div>
                    </div>

                    {/* Pan */}
                    <div className="flex items-center gap-3 text-sm group/item">
                        <div className="w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover/item:border-cyan-500/40 transition-colors">
                            <Move size={16} className="text-cyan-500/80" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-200 font-bold text-xs uppercase">Right Click + Drag</span>
                            <span className="text-cyan-600/80 text-[10px] uppercase tracking-wide">Pan View</span>
                        </div>
                    </div>

                    {/* Zoom */}
                    <div className="flex items-center gap-3 text-sm group/item">
                        <div className="w-8 h-8 rounded-lg bg-cyan-900/20 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover/item:border-cyan-500/40 transition-colors">
                            <ZoomIn size={16} className="text-cyan-500/80" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-gray-200 font-bold text-xs uppercase">Scroll Wheel</span>
                            <span className="text-cyan-600/80 text-[10px] uppercase tracking-wide">Zoom In/Out</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
