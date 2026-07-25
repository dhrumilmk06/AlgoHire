import { useState } from 'react'

type ArrayControlsProps = {
    onAccess: (index: number) => void
    onSearch: (value: number) => void
    isAnimating: boolean
}

export const ArrayControls = ({ onAccess, onSearch, isAnimating }: ArrayControlsProps) => {
    const [accessIndex, setAccessIndex] = useState('')
    const [searchValue, setSearchValue] = useState('')

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-xl p-4 rounded-2xl border border-white/10 border-t-white/20 shadow-2xl flex flex-col md:flex-row gap-6">

            {/* Access Control */}
            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    value={accessIndex}
                    onChange={(e) => setAccessIndex(e.target.value)}
                    placeholder="Idx"
                    className="w-16 px-3 py-2 rounded-xl bg-black/50 text-white border border-white/10 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-center placeholder-gray-600"
                />
                <button
                    onClick={() => {
                        if (accessIndex) {
                            onAccess(parseInt(accessIndex))
                            setAccessIndex('')
                        }
                    }}
                    disabled={isAnimating}
                    className="px-5 py-2 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold border border-indigo-400/30"
                >
                    ACCESS
                </button>
            </div>

            <div className="w-px bg-white/10 h-10 hidden md:block"></div>

            {/* Search Control */}
            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Val"
                    className="w-16 px-3 py-2 rounded-xl bg-black/50 text-white border border-white/10 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-center placeholder-gray-600"
                />
                <button
                    onClick={() => {
                        if (searchValue) {
                            onSearch(parseInt(searchValue))
                            setSearchValue('')
                        }
                    }}
                    disabled={isAnimating}
                    className="px-5 py-2 bg-purple-600/80 hover:bg-purple-500 text-white rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-bold border border-purple-400/30"
                >
                    SEARCH
                </button>
            </div>
        </div>
    )
}
