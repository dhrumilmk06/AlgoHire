type StackControlsProps = {
    onPush: (value: number) => void
    onPop: () => void
    isAnimating: boolean
}

export const StackControls = ({ onPush, onPop, isAnimating }: StackControlsProps) => {
    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 border-t-white/20 shadow-2xl flex gap-4">
            <button
                onClick={() => onPush(Math.floor(Math.random() * 100))}
                disabled={isAnimating}
                className="px-6 py-2.5 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 font-bold tracking-wide border border-cyan-400/30"
            >
                PUSH RANDOM
            </button>
            <button
                onClick={onPop}
                disabled={isAnimating}
                className="px-6 py-2.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:shadow-[0_0_25px_rgba(244,63,94,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all duration-300 font-bold tracking-wide border border-rose-400/30"
            >
                POP
            </button>
        </div>
    )
}
