import type { ComponentType } from 'react';
import type { AlgorithmAdapter } from '../core/adapter/AlgorithmAdapter';
import type { Step } from '../types/Algorithm';
import { IslandSnapshotManager } from '../families/graph/problems/200/adapter';
import { IslandGridVisualizer } from '../components/visualizers/IslandGridVisualizer';
import { LongestPalindromeAdapter } from '../families/string/problems/5/adapter';
import { LongestPalindromeVisualizer } from '../families/string/problems/5/visualizer';

export interface ProblemDefinition<XS> {
    id: number;
    adapterFactory: (steps: Step[], visualData: any) => AlgorithmAdapter<XS> | null;
    visualizer: ComponentType<{ snapshot: XS }>;
}

const REGISTRY: Record<number, ProblemDefinition<any>> = {};

export function registerProblem<XS>(def: ProblemDefinition<XS>) {
    REGISTRY[def.id] = def;
}

export function getProblemDefinition(id: number): ProblemDefinition<any> | undefined {
    return REGISTRY[id];
}

// REGISTER PROBLEMS HARDCODED FOR NOW (Or could be in their own files calling register)
// Problem 200
registerProblem({
    id: 200,
    adapterFactory: (steps: Step[], visualData: any) => {
        if (Array.isArray(visualData) && visualData.length > 0 && Array.isArray(visualData[0])) {
            return new IslandSnapshotManager(steps, visualData as string[][]);
        }
        return null; // Invalid data for this problem
    },
    visualizer: IslandGridVisualizer
});

// Problem 5
registerProblem({
    id: 5,
    adapterFactory: (steps: Step[], visualData: any) => {
        if (visualData) {
            return new LongestPalindromeAdapter(steps, visualData);
        }
        return null;
    },
    visualizer: LongestPalindromeVisualizer
});
