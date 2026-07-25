

interface ExplanationPanelProps {
    text: string;
}

export function ExplanationPanel({ text }: ExplanationPanelProps) {
    if (!text) return null;

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-2xl w-full mx-4 z-20 pointer-events-none">
            <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 text-slate-100 p-4 rounded-xl shadow-2xl text-center font-medium text-lg leading-snug animate-in fade-in slide-in-from-bottom-4 duration-300">
                {text}
            </div>
        </div>
    );
}
