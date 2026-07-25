import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

type AuthContextType = {
    session: Session | null;
    loading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: import('@supabase/supabase-js').Session | null } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: string, session: import('@supabase/supabase-js').Session | null) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ session, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
