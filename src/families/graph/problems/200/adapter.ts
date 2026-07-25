import type { AlgorithmAdapter } from "../../../../core/adapter/AlgorithmAdapter";
import type { Step } from "../../../../types/Algorithm";
import type { GridSnapshot, GridCell, CellVisualState } from "../../../../core/visual/VisualSnapshot";

export type GridVisualType = CellVisualState;

export function mapCellToVisual(value: string | number, state?: string): GridVisualType {
    if (state === "visited") return "visited";
    if (state === "active") return "active";
    if (value === "1" || value === 1) return "land";
    return "water";
}

export class IslandSnapshotManager implements AlgorithmAdapter<GridSnapshot> {
    private snapshots: GridSnapshot[] = [];
    private steps: Step[];
    private initialGrid: string[][];

    constructor(steps: Step[], initialGrid: string[][]) {
        this.steps = steps;

        // Detect wrapped grid (Legacy VisualData format: [grid])
        // If initialGrid is [[row1, row2...]] (1 element which is the actual grid)
        if (
            initialGrid.length === 1 &&
            Array.isArray(initialGrid[0]) &&
            Array.isArray((initialGrid[0] as any)[0])
        ) {
            this.initialGrid = initialGrid[0] as any as string[][];
        } else {
            this.initialGrid = initialGrid;
        }

        this.generateSnapshots();
    }

    public getInitialSnapshot(): GridSnapshot {
        return Object.freeze({
            grid: this.initialGrid.map(row => row.map(val => ({ value: val, visual: mapCellToVisual(val) }))),
            islandCount: 0
        });
    }

    public getSnapshot(index: number): GridSnapshot {
        if (index < 0) {
            return this.getInitialSnapshot();
        }
        if (index >= this.snapshots.length) {
            return this.snapshots[this.snapshots.length - 1];
        }
        return this.snapshots[index];
    }

    public getTotalSteps(): number {
        return this.snapshots.length;
    }

    public dispose(): void {
        this.snapshots = [];
        this.steps = [];
    }

    private generateSnapshots() {
        // 1. Initialize Base State
        // Ensure we handle both raw 2D arrays and potentially wrap if needed, 
        // but numIslands.ts guarantees inputGrid is string[][].
        let currentGrid: GridCell[][] = this.initialGrid.map(row =>
            row.map(val => ({
                value: val,
                visual: mapCellToVisual(val) // Initial state
            }))
        );

        let currentIslandCount = 0;

        // 2. Iterate and generate snapshots
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];

            // PERSISTENT CHANGES
            // We must update the 'currentGrid' if the step implies a permanent change.
            if (step.type === 'MUTATE_GRID' && step.indices) {
                const [r, c] = step.indices;
                if (currentGrid[r] && currentGrid[r][c]) {
                    // Update permanent value
                    if (step.value !== undefined) {
                        currentGrid[r][c].value = step.value;
                    }
                    // Update permanent visual if provided, otherwise compute from value
                    // Typically MUTATE_GRID sends 'visited' logic
                    const visualType = step.customValues?.visualType as CellVisualState;
                    if (visualType) {
                        currentGrid[r][c].visual = visualType;
                    } else {
                        currentGrid[r][c].visual = mapCellToVisual(currentGrid[r][c].value);
                    }
                }
            }

            // Sync persistent island count
            if (step.customValues?.islandCount !== undefined) {
                currentIslandCount = step.customValues.islandCount;
            }


            // TRANSIENT CHANGES (For the snapshot only)
            // Clone the grid to create an isolated snapshot frame
            // Optimized clone: we can optimize this later if needed, for now a map is safe.
            const snapshotGrid = currentGrid.map(row => row.map(cell => ({ ...cell })));

            // Apply transient highlights
            if (step.indices) {
                const [r, c] = step.indices;
                if (snapshotGrid[r] && snapshotGrid[r][c]) {
                    // If the step has a specific transient visual type, apply it
                    // e.g. POINTER -> active
                    // DFS_CALL -> might be active or visited
                    if (step.customValues?.visualType) {
                        snapshotGrid[r][c].visual = step.customValues.visualType as CellVisualState;
                    } else if (step.type === 'POINTER' || step.type === 'DFS_CALL') {
                        // Default transient highlight if not explicitly provided
                        snapshotGrid[r][c].visual = 'active';
                    }
                }
            }

            this.snapshots.push(Object.freeze({
                grid: snapshotGrid,
                islandCount: currentIslandCount
            }));
        }
    }
}
