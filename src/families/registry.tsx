import { lazy, type ComponentType } from 'react';
import Fallback from './Fallback';

// Helper to safely import a module, falling back if it fails or lacks a default export
const safeImport = (factory: () => Promise<{ default: ComponentType<any> }>) => {
    return lazy(() =>
        factory()
            .then((module) => {
                if (!module.default) {
                    console.warn('Module loaded but missing default export, using Fallback.');
                    return { default: Fallback };
                }
                return module;
            })
            .catch((error) => {
                console.error('Failed to load family component:', error);
                return { default: Fallback };
            })
    );
};

// We cast to any here because the modules might be empty or missing default exports,
// which we handle at runtime in safeImport.
export const FamilyRegistry = {
    array: safeImport(() => import('./array') as Promise<any>),
    stack: safeImport(() => import('./stack') as Promise<any>),
    queue: safeImport(() => import('./queue') as Promise<any>),
    linkedlist: safeImport(() => import('./linkedlist') as Promise<any>),
    tree: safeImport(() => import('./tree') as Promise<any>),
    graph: safeImport(() => import('./graph') as Promise<any>),
    hash: safeImport(() => import('./hash') as Promise<any>),
    heap: safeImport(() => import('./heap') as Promise<any>),
} as const;

export type FamilyId = keyof typeof FamilyRegistry;
