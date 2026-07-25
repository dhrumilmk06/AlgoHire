import { describe, it, expect } from 'vitest';
import { LongestPalindromeAdapter } from '../adapter';
import { runLongestPalindrome } from '../algorithm';

describe('LongestPalindromeAdapter', () => {
    const input = 'babad';
    // Mock visual data as array of strings or just the string
    const visualData = input.split('');
    const steps = runLongestPalindrome(input);

    it('should initialize with correct snapshot', () => {
        const adapter = new LongestPalindromeAdapter(steps, visualData);
        const initial = adapter.getInitialSnapshot();
        expect(initial.chars.length).toBe(5);
        expect(initial.leftPointer).toBe(-1);
        expect(initial.explanation).toBe('Ready to execute.');
    });

    it('should generate snapshots for all steps', () => {
        const adapter = new LongestPalindromeAdapter(steps, visualData);
        expect(adapter.getTotalSteps()).toBe(steps.length);
    });

    it('should retrieve immutable snapshots', () => {
        const adapter = new LongestPalindromeAdapter(steps, visualData);
        const snap1 = adapter.getSnapshot(1);
        expect(Object.isFrozen(snap1)).toBe(true);
    });

    it('should track global best range', () => {
        const adapter = new LongestPalindromeAdapter(steps, visualData);
        const lastSnap = adapter.getSnapshot(adapter.getTotalSteps() - 1);
        // For 'babad', best is 'bab' [0,2] or 'aba' [1,3]. Algorithm usually picks first found or expanded.
        // My algorithm updates on `len > end - start`. 
        // 1. Center 0 ('b'): 'b' -> [0,0]
        // 2. Center 1 ('a'): 'bab' -> [0,2]
        // 3. Center 2 ('b'): 'aba' -> [1,3] (len 3, not > 3, so stays [0,2]?)
        // Let's check algorithm logic: if (len > end - start)
        // [0,2] len 3. [1,3] len 3. 3 > 3 is false. So [0,2] 'bab' should win.
        expect(lastSnap.globalBestRange).toEqual([0, 2]);
    });
});
