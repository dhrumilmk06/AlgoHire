import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'


// Icons (Simple SVG shapes for now, or we can use generic text icons)
const Icons = {
    Array: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
            <line x1="8" y1="7" x2="8" y2="17" />
            <line x1="16" y1="7" x2="16" y2="17" />
        </svg>
    ),
    Stack: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5l-8 4 8 4 8-4-8-4z" />
            <path d="M4 14l8 4 8-4" />
            <path d="M4 18l8 4 8-4" />
        </svg>
    ),
    Queue: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
    ),
    LinkedList: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="12" r="3" />
            <path d="M9 12h6" />
        </svg>
    ),
    Tree: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <path d="M12 8L6 16" />
            <path d="M12 8L18 16" />
            <circle cx="6" cy="19" r="3" />
            <circle cx="18" cy="19" r="3" />
        </svg>
    ),
    Graph: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="12" cy="18" r="3" />
            <path d="M8 8l8 8" />
            <path d="M16 8l-8 8" />
        </svg>
    ),
    Hash: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="9" x2="20" y2="9" />
            <line x1="4" y1="15" x2="20" y2="15" />
            <line x1="10" y1="3" x2="8" y2="21" />
            <line x1="16" y1="3" x2="14" y2="21" />
        </svg>
    ),
    Heap: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l-6 12l6 6l6-6z" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    Search: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    ),
    Sorting: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
    ),
    Pathfinding: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 3-3 3" />
            <path d="M15 5H9a5 5 0 000 10h6" />
            <circle cx="18" cy="18" r="3" />
        </svg>
    ),
    Sandbox: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
    ),
    ArraySandbox: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17l6-6 6 6" />
            <path d="M4 17h12" />
            <path d="M12 19h8" />
        </svg>
    ),
    LeetCode: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    ),
    Problems: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#06b6d4" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 9h6M9 12h6M9 15h4" />
        </svg>
    ),
    Sessions: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={active ? "#a78bfa" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
}

type MenuProps = {
    onSelectLevel: (level: string) => void
    currentLevel: string
}

export const Menu = ({ onSelectLevel, currentLevel }: MenuProps) => {
    const [isDSOpen, setIsDSOpen] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const groups = [
        {
            title: 'DATA STRUCTURES',
            items: ['Array', 'Stack', 'Queue', 'LinkedList', 'Tree', 'Graph', 'Hash', 'Heap']
        },
        {
            title: 'ALGORITHMS',
            items: [/* 'Search', */ 'Sorting', 'Pathfinding', 'Sandbox', 'ArraySandbox', 'LeetCode', 'Problems', 'Sessions']
        }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setIsDSOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsDSOpen(false);
            }
        };

        if (isDSOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isDSOpen]);

    return (
        <div
            ref={sidebarRef}
            className={`
                absolute left-0 top-0 h-full z-[100] bg-slate-900/80 backdrop-blur-md border-r border-white/10 shadow-2xl flex flex-col pt-8 transition-all duration-300 ease-in-out
                ${isDSOpen ? 'w-64' : 'w-20'}
            `}
        >
            {/* Logo/Header Area */}
            <div className="flex items-center justify-center mb-6 h-12 w-full overflow-hidden shrink-0">
                <button
                    onClick={() => setIsDSOpen(!isDSOpen)}
                    className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20 text-white font-bold text-xl hover:bg-cyan-400 transition-colors cursor-pointer active:scale-95"
                    title="Toggle Menu"
                >
                    DS
                </button>
            </div>

            <div className="flex-1 flex flex-col gap-6 px-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {groups.map((group, groupIndex) => (
                    <div key={group.title}>
                        {/* Section Header - Only visible when expanded */}
                        <div className={`
                            text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 transition-opacity duration-200 px-4 whitespace-nowrap
                            ${isDSOpen ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}
                        `}>
                            {group.title}
                        </div>

                        {/* Separator (Collapsed Mode) */}
                        {!isDSOpen && groupIndex > 0 && <div className="border-t border-cyan-500/20 mx-2 my-2"></div>}

                        {/* Items */}
                        <div className="flex flex-col gap-1">
                            {group.items.map((level) => {
                                const isActive = currentLevel === level;
                                const Icon = Icons[level as keyof typeof Icons];

                                return (
                                    <button
                                        key={level}
                                        onClick={() => onSelectLevel(level)}
                                        className={`
                                            flex items-center h-10 rounded-lg transition-all duration-200 group relative outline-none
                                            ${isDSOpen ? 'px-4 w-full justify-start' : 'w-10 self-center justify-center'}
                                            ${isActive
                                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 ring-1 ring-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                                            }
                                        `}
                                        title={!isDSOpen ? level : undefined}
                                    >
                                        {/* Icon - Direct Child */}
                                        {Icon && Icon(isActive)}

                                        {/* Label (Expanded) */}
                                        <span className={`
                                            text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
                                            ${isDSOpen ? 'ml-3 opacity-100 max-w-[150px]' : 'ml-0 opacity-0 max-w-0'}
                                        `}>
                                            {level}
                                        </span>

                                        {/* Sidebar Tooltip (Collapsed ONLY) */}
                                        {!isDSOpen && (
                                            <span className="absolute left-full top-1/2 -translate-y-1/2 ml-4 bg-slate-900 text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-md border border-slate-700 shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                                {level}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 text-center shrink-0">
                <div className="flex flex-col gap-2">
                    <LogoutButton isDSOpen={isDSOpen} />
                    {isDSOpen && <div className="text-[10px] text-slate-600 font-mono mt-2">v1.2.0</div>}
                </div>
            </div>
        </div>
    )
}

const LogoutButton = ({ isDSOpen }: { isDSOpen: boolean }) => {
    try {
        const { logout } = useAuth();
        return (
            <button
                onClick={logout}
                className={`
                     group flex items-center h-10 rounded-lg transition-all duration-200 border border-transparent
                     ${isDSOpen ? 'px-4 w-full justify-start' : 'w-10 self-center justify-center'}
                     text-slate-400 hover:text-red-400 hover:bg-white/5
                 `}
                title={!isDSOpen ? "Logout" : undefined}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>

                <span className={`
                        text-sm font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
                        ${isDSOpen ? 'ml-3 opacity-100 max-w-[150px]' : 'ml-0 opacity-0 max-w-0'}
                `}>
                    Logout
                </span>
            </button>
        )
    } catch { return null }
}
