import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState(import.meta.env.VITE_SUPABASE_URL ? '' : 'admin@example.com');
    const [password, setPassword] = useState(import.meta.env.VITE_SUPABASE_URL ? '' : 'password');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            // Success! The AuthContext will pick up the session change automatically
            // No need to manually set loading false here as the component will likely unmount
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] hover:shadow-cyan-900/10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-cyan-400">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Access DSA Visualizer</h1>
                    <p className="text-slate-400 text-sm mt-2">Enter your credentials to continue.</p>
                    {!import.meta.env.VITE_SUPABASE_URL && (
                        <div className="mt-3 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
                            Developer Mode (Mock Auth)
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Error Banner */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-12 text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors bg-transparent border-none p-1 outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all mt-2 
                            ${isLoading
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-900/20 active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? 'Verifying...' : 'Sign In'}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-xs text-slate-600">
                            Secure Authentication
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};
