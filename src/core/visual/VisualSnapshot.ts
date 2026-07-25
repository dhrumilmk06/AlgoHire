export type CellVisualState = 'land' | 'water' | 'visited' | 'active';

export interface GridCell {
    value: string | number;
    visual: CellVisualState;
}

export interface GridSnapshot {
    grid: GridCell[][];
    islandCount: number;
}
