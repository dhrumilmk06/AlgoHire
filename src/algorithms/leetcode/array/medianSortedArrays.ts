import type { Step, AlgorithmVariant } from '../../../types/Algorithm'

export const medianSortedArraysMeta = {
    id: 'median-sorted-arrays',
    title: 'Median of Two Sorted Arrays',
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\nThe overall run time complexity should be O(log (m+n)).',
    complexity: 'Time: O(log(m + n)) | Space: O(1)',
    defaultInput: '[1,3], [2]',
    defaultTarget: 0
}

const javaCode = `
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        if (nums1.length > nums2.length) {
            return findMedianSortedArrays(nums2, nums1);
        }

        int m = nums1.length;
        int n = nums2.length;
        int low = 0, high = m;

        while (low <= high) {
            int cut1 = (low + high) / 2;
            int cut2 = (m + n + 1) / 2 - cut1;

            int left1 = (cut1 == 0) ? Integer.MIN_VALUE : nums1[cut1 - 1];
            int left2 = (cut2 == 0) ? Integer.MIN_VALUE : nums2[cut2 - 1];
            int right1 = (cut1 == m) ? Integer.MAX_VALUE : nums1[cut1];
            int right2 = (cut2 == n) ? Integer.MAX_VALUE : nums2[cut2];

            if (left1 <= right2 && left2 <= right1) {
                if ((m + n) % 2 == 0) {
                    return (Math.max(left1, left2) + Math.min(right1, right2)) / 2.0;
                } else {
                    return Math.max(left1, left2);
                }
            } else if (left1 > right2) {
                high = cut1 - 1;
            } else {
                low = cut1 + 1;
            }
        }
        return 0.0;
    }
}
`

const runMedianSortedArrays = (input: any, _target: number): Step[] => {
    const steps: Step[] = []

    // Safety check for multi-array input
    if (!Array.isArray(input) || input.length !== 2 || !Array.isArray(input[0])) {
        return [{ type: 'RETURN', message: 'Invalid input. Need two sorted arrays.', line: 1 }]
    }

    let nums1 = input[0] as number[]
    let nums2 = input[1] as number[]

    // Note: The UI renders raw input, so row 0 is input[0], row 1 is input[1].
    // If we swap internally for logic, we must map indices back to visual rows.
    let visualRow1 = 0
    let visualRow2 = 1

    if (nums1.length > nums2.length) {
        let temp = nums1; nums1 = nums2; nums2 = temp;
        visualRow1 = 1; // logical nums1 is actually visual row 1
        visualRow2 = 0; // logical nums2 is actually visual row 0

        steps.push({
            type: 'POINTER',
            message: 'Ensuring nums1 is shorter than nums2. Swapping logical references.',
            rowHighlights: { [visualRow1]: [], [visualRow2]: [] }, // Clear
            line: 3
        })
    }

    const m = nums1.length
    const n = nums2.length
    let low = 0
    let high = m

    steps.push({
        type: 'POINTER',
        message: `Binary Search initialization. nums1 length: ${m}, nums2 length: ${n}. Range: [${low}, ${high}]`,
        line: 9
    })

    while (low <= high) {
        const cut1 = Math.floor((low + high) / 2)
        const cut2 = Math.floor((m + n + 1) / 2) - cut1

        steps.push({
            type: 'POINTER',
            message: `Partitioning. cut1=${cut1}, cut2=${cut2}`,
            rowHighlights: {
                [visualRow1]: [cut1 - 1, cut1].filter(i => i >= 0 && i < m),
                [visualRow2]: [cut2 - 1, cut2].filter(i => i >= 0 && i < n)
            },
            line: 12,
            customValues: {
                state: 'processing',
                animation: { type: "cut_move", indices: [cut1, cut2] }
            }
        })

        const left1 = (cut1 === 0) ? Number.NEGATIVE_INFINITY : nums1[cut1 - 1]
        const left2 = (cut2 === 0) ? Number.NEGATIVE_INFINITY : nums2[cut2 - 1]
        const right1 = (cut1 === m) ? Number.POSITIVE_INFINITY : nums1[cut1]
        const right2 = (cut2 === n) ? Number.POSITIVE_INFINITY : nums2[cut2]

        // Helper to format values for display
        const fmt = (val: number) => {
            if (val === Number.NEGATIVE_INFINITY) return '-∞'
            if (val === Number.POSITIVE_INFINITY) return '+∞'
            return val
        }

        steps.push({
            type: 'READ',
            message: `Checking boundary values: L1=${fmt(left1)}, R1=${fmt(right1)} | L2=${fmt(left2)}, R2=${fmt(right2)}`,
            rowHighlights: {
                [visualRow1]: [cut1 - 1, cut1].filter(i => i >= 0 && i < m),
                [visualRow2]: [cut2 - 1, cut2].filter(i => i >= 0 && i < n)
            },
            line: 15,
            customValues: {
                state: 'accessed',
                animation: { type: "cut_move", indices: [cut1, cut2] }
            }
        })

        if (left1 <= right2 && left2 <= right1) {
            const highlights = {
                [visualRow1]: [cut1 - 1, cut1].filter(i => i >= 0 && i < m),
                [visualRow2]: [cut2 - 1, cut2].filter(i => i >= 0 && i < n)
            }

            steps.push({
                type: 'FOUND',
                message: 'Valid partition found! (left1 <= right2 && left2 <= right1)',
                rowHighlights: highlights,
                line: 20,
                // @ts-ignore - Local phase property
                phase: 'valid',
                kind: 'partition_valid',
                customValues: {
                    state: 'executed',
                    animation: { type: "partition_valid" }
                }
            })

            let result = 0
            if ((m + n) % 2 === 0) {
                const maxLeft = Math.max(left1, left2)
                const minRight = Math.min(right1, right2)
                result = (maxLeft + minRight) / 2.0
                steps.push({
                    type: 'COMPUTE',
                    message: `Total length is even. Median = (max(L1, L2) + min(R1, R2)) / 2 = (${fmt(maxLeft)} + ${fmt(minRight)}) / 2 = ${result}`,
                    rowHighlights: highlights,
                    line: 22,
                    // @ts-ignore
                    phase: 'valid',
                    customValues: {
                        state: 'executed',
                        animation: { type: "median_select" }
                    }
                })
                return steps
            } else {
                result = Math.max(left1, left2)
                steps.push({
                    type: 'COMPUTE',
                    message: `Total length is odd. Median = max(L1, L2) = ${fmt(result)}`,
                    rowHighlights: highlights,
                    line: 24,
                    // @ts-ignore
                    phase: 'valid',
                    customValues: {
                        state: 'executed',
                        animation: { type: "median_select" }
                    }
                })
                return steps
            }
        } else if (left1 > right2) {
            high = cut1 - 1
            steps.push({
                type: 'MOVE_POINTER',
                message: `left1 (${fmt(left1)}) > right2 (${fmt(right2)}). Moving high to ${high}.`,
                rowHighlights: {
                    [visualRow1]: [cut1 - 1].filter(x => x >= 0)
                },
                line: 27,
                // @ts-ignore
                phase: 'search',
                customValues: {
                    state: 'processing',
                    animation: { type: "cut_move", indices: [cut1, cut2] }
                }
            })
        } else {
            low = cut1 + 1
            steps.push({
                type: 'MOVE_POINTER',
                message: `left2 (${fmt(left2)}) > right1 (${fmt(right1)}). Moving low to ${low}.`,
                rowHighlights: {
                    [visualRow2]: [cut2 - 1].filter(x => x >= 0)
                },
                line: 29,
                // @ts-ignore
                phase: 'search',
                customValues: {
                    state: 'processing',
                    animation: { type: "cut_move", indices: [cut1, cut2] }
                }
            })
        }
    }

    return [{ type: 'RETURN', message: 'No median found (should not happen for sorted arrays).', line: 33 }]
}

export const medianSortedArraysVariants: Record<string, AlgorithmVariant> = {
    binarySearch: {
        id: 'binarySearch',
        label: 'Binary Search (O(log(m+n)))',
        code: javaCode,
        run: runMedianSortedArrays
    }
}
