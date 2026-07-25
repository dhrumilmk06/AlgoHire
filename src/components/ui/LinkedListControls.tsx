type LinkedListControlsProps = {
    onInsertHead: () => void
    onDeleteHead: () => void
    isAnimating: boolean
    count: number
}

export const LinkedListControls = ({ onInsertHead, onDeleteHead, isAnimating, count }: LinkedListControlsProps) => {
    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 border-t-white/20 shadow-2xl flex gap-4">
            <button
                onClick={onInsertHead}
                disabled={isAnimating || count >= 15}
                className="px-6 py-2.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 font-bold tracking-wide border border-emerald-400/30"
            >
                INSERT AT HEAD
            </button>
            <button
                onClick={onDeleteHead}
                disabled={isAnimating || count === 0}
                className="px-6 py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 font-bold tracking-wide border border-rose-400/30"
            >
                DELETE HEAD
            </button>
        </div>
    )
}
