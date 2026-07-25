import type { Step, AlgorithmVariant } from '../../../types/Algorithm'

export const longestSubstringMeta = {
    id: 'longest-substring',
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string s, return the length of the longest substring without repeating characters.',
    complexity: 'Time: O(n) | Space: O(min(m, n))',
    defaultInput: '"abcabcbb"',
    defaultTarget: 0 // Not used
}

const javaCode = `
class Solution {
    public int lengthOfLongestSubstring(String s) {
        int left = 0;
        int maxLen = 0;
        Set<Character> set = new HashSet<>();

        for (int right = 0; right < s.length(); right++) {
            while (set.contains(s.charAt(right))) {
                set.remove(s.charAt(left));
                left++;
            }
            set.add(s.charAt(right));
            maxLen = Math.max(maxLen, right - left + 1);
        }
        return maxLen;
    }
}
`

const runLongestSubstring = (input: any, _target: number): Step[] => {
    const steps: Step[] = []

    // Handle input: it might be an array of chars (from parseInput) or a raw string
    const s = Array.isArray(input) ? input.join('') : String(input)

    const set = new Set<string>()
    let left = 0
    let maxLen = 0

    // Initial State
    steps.push({
        type: 'POINTER',
        message: 'Initialized left pointer = 0, maxLen = 0. Set is empty.',
        indices: [],
        pointers: { left, right: -1 },
        line: 3
    })

    for (let right = 0; right < s.length; right++) {
        const charRight = s[right]

        steps.push({
            type: 'POINTER',
            message: `Right pointer at index ${right} ('${charRight}').`,
            indices: getWindowIndices(left, right), // Highlight window
            targetIndex: right, // Keep for potential use
            pointers: { left, right },
            line: 7
        })

        while (set.has(charRight)) {
            const charLeft = s[left]

            steps.push({
                type: 'COMPARE',
                message: `Duplicate found ('${charRight}'). Removing '${charLeft}' from set and moving left pointer.`,
                indices: getWindowIndices(left, right),
                pointers: { left, right },
                line: 8
            })

            set.delete(charLeft)
            left++

            steps.push({
                type: 'POINTER', // Logic step
                message: `Left moved to ${left}.`,
                indices: getWindowIndices(left, right),
                pointers: { left, right },
                line: 10
            })
        }

        set.add(charRight)
        const currentLen = right - left + 1

        // Highlight adding
        steps.push({
            type: 'POINTER', // Logic step
            message: `Added '${charRight}' to set.`,
            indices: getWindowIndices(left, right),
            pointers: { left, right },
            line: 12
        })

        if (currentLen > maxLen) {
            maxLen = currentLen
            steps.push({
                type: 'FOUND',
                message: `New max length found: ${maxLen} (Substring: "${s.substring(left, right + 1)}")`,
                indices: getWindowIndices(left, right), // Keep window highlighted
                pointers: { left, right },
                line: 13
            })
        } else {
            steps.push({
                type: 'COMPUTE',
                message: `Current length is ${currentLen}. Max is still ${maxLen}.`,
                indices: getWindowIndices(left, right),
                pointers: { left, right },
                line: 13
            })
        }
    }

    steps.push({
        type: 'RETURN',
        message: `Finished. Max length is ${maxLen}.`,
        pointers: { left, right: s.length - 1 },
        line: 15
    })

    return steps
}

// Helper to get all indices in the window [left, right]
const getWindowIndices = (left: number, right: number): number[] => {
    const indices: number[] = []
    for (let i = left; i <= right; i++) {
        indices.push(i)
    }
    return indices
}

export const longestSubstringVariants: Record<string, AlgorithmVariant> = {
    slidingWindow: {
        id: 'slidingWindow',
        label: 'Sliding Window (O(n))',
        code: javaCode,
        run: runLongestSubstring
    }
}
