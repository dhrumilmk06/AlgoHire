

type CodeWindowProps = {
    code: string
    highlightedLine: number | null
    title?: string
    onClose?: () => void
    variant?: 'floating' | 'embedded'
    className?: string
}

export const CodeWindow = ({
    code = '',
    highlightedLine = null,
    title = 'Algorithm Code',
    onClose,
    variant = 'floating',
    className = ''
}: CodeWindowProps) => {

    const baseClasses = "bg-black/80 backdrop-blur-md rounded-xl border border-cyan-500/30 shadow-[0_0_30px_rgba(8,145,178,0.2)] overflow-hidden font-mono text-sm leading-6 z-50 flex flex-col"
    const floatingClasses = "absolute top-20 right-8 w-[400px] min-w-[300px] min-h-[200px] resize"
    const embeddedClasses = "w-full h-full min-h-0"

    return (
        <div className={`${baseClasses} ${variant === 'floating' ? floatingClasses : embeddedClasses} ${className}`}>
            {/* Header */}
            <div className="bg-black/60 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between backdrop-blur-sm">
                <span className="text-cyan-400 font-bold text-xs uppercase tracking-wider glow-text drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{title}</span>
                <div className="flex gap-2">
                    {onClose ? (
                        <button
                            onClick={onClose}
                            className="text-cyan-500 hover:text-cyan-300 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    ) : (
                        <div className="w-3 h-3 rounded-full bg-cyan-900/50 border border-cyan-500/50"></div>
                    )}
                </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 h-full p-4 text-cyan-100 overflow-auto custom-scrollbar">
                <table className="w-full border-collapse font-mono text-sm">
                    <tbody>
                        {code.split('\n').map((line, i) => {
                            const lineNum = i + 1;
                            const isActive = highlightedLine === lineNum;
                            return (
                                <tr
                                    key={i}
                                    className={`
                                        transition-colors duration-200
                                        ${isActive
                                            ? 'bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]' // <tr> highlight
                                            : 'hover:bg-white/5'}
                                    `}
                                >
                                    {/* Line Number Column */}
                                    <td className={`
                                        w-10 pr-4 text-right select-none border-r border-cyan-500/20 align-top py-0.5
                                        ${isActive ? 'text-yellow-500 font-bold border-yellow-500/50' : 'text-slate-600'}
                                    `}>
                                        {lineNum}
                                    </td>

                                    {/* Code Content Column */}
                                    <td className={`
                                        pl-4 whitespace-pre py-0.5
                                        ${isActive ? 'text-yellow-50' : 'text-cyan-100'}
                                    `}>
                                        {line}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Footer */}
            <div className="bg-black/60 px-4 py-1 text-[10px] text-cyan-700/70 flex justify-end tracking-wider uppercase border-t border-cyan-500/10">
                // SYSTEM_READY
            </div>
        </div>
    )
}
