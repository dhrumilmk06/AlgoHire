import { useState } from 'react'

type QueueControlsProps = {
    onEnqueue: (value: number) => void
    onDequeue: () => void
    isAnimating: boolean
}

export const QueueControls = ({ onEnqueue, onDequeue, isAnimating }: QueueControlsProps) => {
    const [inputValue, setInputValue] = useState('')

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 border-t-white/20 shadow-2xl flex gap-4">
            <div className="flex gap-2">
                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-black/50 text-white border border-white/10 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-center placeholder-gray-600"
                    placeholder="Val"
                />
                <button
                    onClick={() => {
                        if (inputValue) {
                            onEnqueue(parseInt(inputValue))
                            setInputValue('')
                        }
                    }}
                    disabled={isAnimating}
                    className="px-5 py-2 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-xl shadow-[0_0_15px_rgba(8,145,178,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold border border-cyan-400/30"
                >
                    ENQUEUE
                </button>
            </div>

            <div className="w-px bg-white/20 mx-2"></div>

            <button
                onClick={onDequeue}
                disabled={isAnimating}
                className="px-5 py-2 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold border border-rose-400/30"
            >
                DEQUEUE
            </button>
        </div>
    )
}
