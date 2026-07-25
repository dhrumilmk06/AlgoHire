import { useEffect, useMemo } from 'react';
import type { AlgorithmAdapter } from '../core/adapter/AlgorithmAdapter';

interface ProblemBoundaryProps<TSnapshot> {
    /** 
     * Factory function to create the adapter. 
     * IMPORTANT: This should be memoized or stable to avoid recreating adapters unnecessarily.
     */
    adapterFactory: () => AlgorithmAdapter<TSnapshot> | null;

    /**
     * Render prop that receives the adapter instance.
     */
    children: (adapter: AlgorithmAdapter<TSnapshot>) => React.ReactNode;
}

export function ProblemBoundary<TSnapshot>({ adapterFactory, children }: ProblemBoundaryProps<TSnapshot>) {
    // 1. Create Adapter Once
    const adapter = useMemo(() => {
        return adapterFactory();
    }, [adapterFactory]);

    // 2. Lifecycle Management
    useEffect(() => {
        return () => {
            // cleanup on unmount or when adapter changes
            if (adapter) {
                adapter.dispose();
            }
        };
    }, [adapter]);

    if (!adapter) {
        return null;
    }

    // 3. Render children with adapter
    return <>{children(adapter)}</>;
}
