import type { Step, AlgorithmVariant } from '../../../types/Algorithm'
import { generateSteps as generateStepsNew } from '../../../families/array/problems/1';

export const USE_NEW_IMPL = false;

export const twoSumMeta = {
    id: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    complexity: 'Time: O(n^2) | Space: O(1)',
    defaultInput: '2, 7, 11, 15', // Simple CSV for array
    defaultTarget: 9
}

const bruteForceCode = `for (int i = 0; i < nums.length; i++) {
    for (int j = i + 1; j < nums.length; j++) {
        if (nums[i] + nums[j] == target) {
            return new int[]{i, j};
        }
    }
}
return new int[]{};`

const runBruteForce = (nums: number[], target: number): Step[] => {
    if (USE_NEW_IMPL) {
        // Cast to any because the new Step type is not compatible with the old one
        return generateStepsNew(nums, target) as any;
    }
    const steps: Step[] = []
    for (let i = 0; i < nums.length; i++) {
        steps.push({ type: 'POINTER', indices: [i], message: `Outer loop: Checking i=${i} (value: ${nums[i]})`, line: 1 })
        for (let j = i + 1; j < nums.length; j++) {
            steps.push({ type: 'POINTER', indices: [i, j], message: `Inner loop: Checking j=${j} (value: ${nums[j]})`, line: 2 })
            const sum = nums[i] + nums[j]
            steps.push({ type: 'COMPARE', indices: [i, j], value: sum, message: `Check sum: ${nums[i]} + ${nums[j]} == ${target}?`, line: 3 })
            if (sum === target) {
                steps.push({ type: 'FOUND', indices: [i, j], message: `Match found! Returning indices [${i}, ${j}].`, line: 4 })
                return steps
            }
        }
    }
    steps.push({ type: 'RETURN', message: 'No solution found.', line: 8 })
    return steps
}

const hashMapCode = `Map<Integer, Integer> map = new HashMap<>();
for (int i = 0; i < nums.length; i++) {
    int complement = target - nums[i];
    if (map.containsKey(complement)) {
        return new int[] { map.get(complement), i };
    }
    map.put(nums[i], i);
}
return new int[]{};`

const runHashMap = (nums: number[], target: number): Step[] => {
    const steps: Step[] = []
    const map = new Map<number, number>()

    for (let i = 0; i < nums.length; i++) {
        const val = nums[i]
        const complement = target - val

        steps.push({
            type: 'POINTER',
            indices: [i],
            message: `Current value: ${val} at index ${i}. Need complement: ${complement}.`,
            line: 2 // Loop start
        })

        // Check map
        steps.push({
            type: 'COMPARE',
            indices: [i],
            message: `Checking map for complement ${complement}...`,
            line: 4 // if (map.containsKey)
        })

        if (map.has(complement)) {
            const complementIndex = map.get(complement)!
            steps.push({
                type: 'FOUND',
                indices: [complementIndex, i], // Highlight both
                message: `Found complement ${complement} at index ${complementIndex}. Return [${complementIndex}, ${i}].`,
                line: 5 // return
            })
            return steps
        }

        // Put in map
        map.set(val, i)
        steps.push({
            type: 'POINTER',
            indices: [i],
            message: `Complement not found. Adding ${val} -> index ${i} to map.`,
            line: 7 // map.put
        })
    }

    steps.push({ type: 'RETURN', message: 'No solution found.', line: 9 })
    return steps
}

export const twoSumVariants: Record<string, AlgorithmVariant> = {
    bruteForce: { id: 'bruteForce', label: 'Brute Force (O(n²))', code: bruteForceCode, run: runBruteForce },
    hashMap: { id: 'hashMap', label: 'Hash Map (O(n))', code: hashMapCode, run: runHashMap }
}
// Legacy export for compatibility if needed, though we should switch to variants
export const runTwoSum = runBruteForce
export const twoSumCode = bruteForceCode
