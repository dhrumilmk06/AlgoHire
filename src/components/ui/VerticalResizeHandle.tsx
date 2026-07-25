interface VerticalResizeHandleProps {
    onMouseDown: (e: React.MouseEvent) => void
    isDragging?: boolean
}

export const VerticalResizeHandle = ({ onMouseDown, isDragging }: VerticalResizeHandleProps) => {
    return (
        <div
            className="group w-2 hover:w-3 cursor-col-resize flex-shrink-0 relative z-50 flex justify-center bg-transparent -ml-1 hover:ml-0 transition-all duration-200"
            onMouseDown={onMouseDown}
        >
            {/* Visual Bar */}
            <div
                className={`
          w-[2px] h-full rounded-full transition-all duration-200
          ${isDragging
                        ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                        : 'bg-slate-800 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    }
        `}
            />
        </div>
    )
}
