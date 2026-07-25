
import React from 'react';
import { X, Info } from 'lucide-react';
import { DS_INFO } from '../constants/dsInfo';
import type { DSType } from '../constants/dsInfo';

interface InfoModalProps {
    type: DSType;
    onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
    // Safety check in case import fails or object is malformed
    if (!DS_INFO || !DS_INFO[type]) {
        console.warn(`DS_INFO missing or type '${type}' not found.`);
        return null;
    }

    const info = DS_INFO[type];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-[90%] max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <Info className="text-cyan-400" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-wide">{info.title}</h2>
                </div>

                {/* Definition */}
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {info.definition}
                </p>

                {/* Complexity Table */}
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 mb-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Time Complexity</h3>
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase">Access</span>
                            <span className="text-sm font-mono font-bold text-cyan-400">{info.complexity.access}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase">Search</span>
                            <span className="text-sm font-mono font-bold text-yellow-400">{info.complexity.search}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase">Insert</span>
                            <span className="text-sm font-mono font-bold text-green-400">{info.complexity.insert}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-500 uppercase">Delete</span>
                            <span className="text-sm font-mono font-bold text-red-400">{info.complexity.delete}</span>
                        </div>
                    </div>
                </div>

                {/* Analogy Box */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 relative">
                    <div className="absolute -top-2 left-4 px-2 bg-slate-900 border border-yellow-500/20 rounded text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                        Real World Analogy
                    </div>
                    <p className="text-sm text-yellow-200/90 italic leading-relaxed pt-2">
                        "{info.analogy}"
                    </p>
                </div>

                {/* Footer Hint */}
                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold rounded-full transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        Got it, Let's Code!
                    </button>
                </div>
            </div>
        </div>
    );
};
