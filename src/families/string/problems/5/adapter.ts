import type { AlgorithmAdapter } from "../../../../core/adapter/AlgorithmAdapter";
import type { Step } from "../../../../types/Algorithm";

export interface PalindromeSnapshot {
    chars: {
        val: string,
        status: 'default' | 'center' | 'active' | 'match' | 'mismatch' | 'best-range' | 'current-range'
    }[];
    leftPointer: number;
    rightPointer: number;
    globalBestRange: [number, number]; // [start, end] inclusive
    currentRange: [number, number] | null;
    explanation: string;
    centerType: 'odd' | 'even' | null;
}

export class LongestPalindromeAdapter implements AlgorithmAdapter<PalindromeSnapshot> {
    private snapshots: PalindromeSnapshot[] = [];
    private steps: Step[];
    private inputString: string;

    constructor(steps: Step[], visualData: any) {
        this.steps = steps;
        // Parse visualData, expecting array of chars or string
        this.inputString = Array.isArray(visualData) ? visualData.join('') : String(visualData);
        this.generateSnapshots();
    }

    public getInitialSnapshot(): PalindromeSnapshot {
        return Object.freeze(this.createBaseSnapshot('Ready to execute.', -1, -1, [0, 0], null, null));
    }

    public getSnapshot(index: number): PalindromeSnapshot {
        if (index < 0) return this.getInitialSnapshot();
        if (index >= this.snapshots.length) return this.snapshots[this.snapshots.length - 1];
        return this.snapshots[index];
    }

    public getTotalSteps(): number {
        return this.snapshots.length;
    }

    public dispose(): void {
        this.snapshots = [];
        this.steps = [];
    }

    private createBaseSnapshot(
        explanation: string,
        left: number,
        right: number,
        globalBest: [number, number],
        current: [number, number] | null,
        centerType: 'odd' | 'even' | null
    ): PalindromeSnapshot {
        // Build chars array based on state
        const chars = this.inputString.split('').map((val, idx) => {
            let status: PalindromeSnapshot['chars'][0]['status'] = 'default';

            // Priority: Mismatch/Match > Current Range > Global Best > Center
            // Actually:
            // 1. If currently comparing (left/right), show match/mismatch/active
            // 2. If inside current valid range, show current-range
            // 3. If inside global best, show best-range

            // Global Best (lowest priority background)
            if (idx >= globalBest[0] && idx <= globalBest[1]) {
                status = 'best-range';
            }

            // Current Valid Range implies we found a palindrome locally
            if (current && idx >= current[0] && idx <= current[1]) {
                status = 'current-range';
            }

            // Pointers (Active comparison)
            if (idx === left || idx === right) {
                // If they are the same index (odd center start), just active
                if (left === right) {
                    status = 'center';
                } else {
                    status = 'active';
                }
            }

            return { val, status };
        });

        // Refine status logic based on context (hacky but effective for static snapshots)
        // We might want to pass 'isMatch' state to override pointer colors
        return {
            chars,
            leftPointer: left,
            rightPointer: right,
            globalBestRange: globalBest,
            currentRange: current,
            explanation,
            centerType
        };
    }

    private generateSnapshots() {
        // Replay steps to build state
        let globalBest: [number, number] = [0, 0];
        let currentRange: [number, number] | null = null;
        let left = -1;
        let right = -1;
        let centerType: 'odd' | 'even' | null = null;

        for (const step of this.steps) {
            const vals = step.customValues || {};

            // Update State from Step
            if (vals.globalBestRange) globalBest = vals.globalBestRange;
            if (vals.currentRange !== undefined) currentRange = vals.currentRange;
            if (vals.left !== undefined) left = vals.left;
            if (vals.right !== undefined) right = vals.right;
            if (vals.centerType !== undefined) centerType = vals.centerType;

            // Create Snapshot
            const snap = this.createBaseSnapshot(step.message || '', left, right, globalBest, currentRange, centerType);

            // Apply specific highlights for this step
            if (step.type === 'COMPARE') {
                const isMatch = vals.isMatch;
                if (left >= 0 && right >= 0) {
                    // Override pointer status
                    if (snap.chars[left]) snap.chars[left].status = isMatch ? 'match' : 'active';
                    if (snap.chars[right]) snap.chars[right].status = isMatch ? 'match' : 'active';
                }
            } else if (step.type === 'MISMATCH') {
                if (snap.chars[left]) snap.chars[left].status = 'mismatch';
                if (snap.chars[right]) snap.chars[right].status = 'mismatch';
            }

            this.snapshots.push(Object.freeze(snap));
        }
    }
}
