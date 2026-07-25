import { useState, useCallback, useEffect, useRef } from 'react';
import type { AlgorithmAdapter } from '../adapter/AlgorithmAdapter';

interface EngineState<TSnapshot> {
    currentStepIndex: number;
    snapshot: TSnapshot | null;
    isRunning: boolean;
    speed: number;
    totalSteps: number;
}

export interface EngineController<TSnapshot> extends EngineState<TSnapshot> {
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    reset: () => void;
    nextStep: () => void;
    prevStep: () => void;
    seek: (index: number) => void;
    setSpeed: (speed: number) => void;
}

export function useEngine<TSnapshot>(adapter: AlgorithmAdapter<TSnapshot> | null): EngineController<TSnapshot> {
    const [state, setState] = useState<EngineState<TSnapshot>>({
        currentStepIndex: -1,
        snapshot: null,
        isRunning: false,
        speed: 1,
        totalSteps: 0
    });

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync Adapter State
    useEffect(() => {
        if (adapter) {
            setState(prev => ({
                ...prev,
                currentStepIndex: -1,
                snapshot: adapter.getInitialSnapshot(),
                totalSteps: adapter.getTotalSteps(),
                isRunning: false
            }));
        } else {
            // Reset if no adapter
            setState(prev => ({
                ...prev,
                currentStepIndex: -1,
                snapshot: null,
                totalSteps: 0,
                isRunning: false
            }));
        }
    }, [adapter]);

    // Playback Loop
    useEffect(() => {
        if (state.isRunning && adapter) {
            timerRef.current = setInterval(() => {
                setState(prev => {
                    const nextIndex = prev.currentStepIndex + 1;
                    if (nextIndex >= prev.totalSteps) {
                        // Stop at end
                        return { ...prev, currentStepIndex: nextIndex, isRunning: false, snapshot: adapter.getSnapshot(nextIndex) };
                    }
                    return { ...prev, currentStepIndex: nextIndex, snapshot: adapter.getSnapshot(nextIndex) };
                });
            }, 1000 / state.speed);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state.isRunning, state.speed, adapter]);

    // Controls
    const play = useCallback(() => {
        if (!adapter) return;
        // If at end, restart
        setState(prev => {
            if (prev.currentStepIndex >= prev.totalSteps) {
                return { ...prev, currentStepIndex: -1, isRunning: true, snapshot: adapter.getSnapshot(-1) };
            }
            return { ...prev, isRunning: true };
        });
    }, [adapter]);

    const pause = useCallback(() => setState(prev => ({ ...prev, isRunning: false })), []);

    const togglePlay = useCallback(() => {
        setState(prev => {
            if (prev.isRunning) return { ...prev, isRunning: false };

            // Logic to restart if at end or start running
            if (prev.currentStepIndex >= prev.totalSteps - 1) { // -1 because strictly less
                // Restart
                // We can't synchronously getSnapshot here safely without effect or adapter access, 
                // but adapter is in closure.
                // Actually, let's keep it simple.
                return { ...prev, currentStepIndex: -1, isRunning: true };
            }
            return { ...prev, isRunning: true };
        });
    }, [adapter]);

    const reset = useCallback(() => {
        if (!adapter) return;
        setState(prev => ({
            ...prev,
            currentStepIndex: -1,
            isRunning: false,
            snapshot: adapter.getInitialSnapshot()
        }));
    }, [adapter]);

    const nextStep = useCallback(() => {
        if (!adapter) return;
        setState(prev => {
            const next = Math.min(prev.currentStepIndex + 1, prev.totalSteps - 1);
            return { ...prev, currentStepIndex: next, snapshot: adapter.getSnapshot(next) };
        });
    }, [adapter]);

    const prevStep = useCallback(() => {
        if (!adapter) return;
        setState(prev => {
            const next = Math.max(prev.currentStepIndex - 1, -1);
            return { ...prev, currentStepIndex: next, snapshot: adapter.getSnapshot(next) };
        });
    }, [adapter]);

    const seek = useCallback((index: number) => {
        if (!adapter) return;
        setState(prev => ({
            ...prev,
            currentStepIndex: index,
            snapshot: adapter.getSnapshot(index)
        }));
    }, [adapter]);

    const setSpeed = useCallback((speed: number) => {
        setState(prev => ({ ...prev, speed }));
    }, []);

    return {
        ...state,
        play,
        pause,
        togglePlay,
        reset,
        nextStep,
        prevStep,
        seek,
        setSpeed
    };
}
