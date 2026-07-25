export interface AlgorithmAdapter<TSnapshot> {
    getInitialSnapshot(): TSnapshot;
    getSnapshot(stepIndex: number): TSnapshot;
    getTotalSteps(): number;
    dispose(): void;
}
