import type { Step } from '../../types';

export const generateSteps = (nums: number[], target: number): Step[] => {
    const steps: Step[] = [];

    for (let i = 0; i < nums.length; i++) {
        steps.push({
            kind: 'POINTER',
            payload: { indices: [i], message: `Outer loop: Checking i=${i} (value: ${nums[i]})`, line: 1 }
        });

        for (let j = i + 1; j < nums.length; j++) {
            steps.push({
                kind: 'POINTER',
                payload: { indices: [i, j], message: `Inner loop: Checking j=${j} (value: ${nums[j]})`, line: 2 }
            });

            const sum = nums[i] + nums[j];
            steps.push({
                kind: 'COMPARE',
                payload: { indices: [i, j], value: sum, message: `Check sum: ${nums[i]} + ${nums[j]} == ${target}?`, line: 3 }
            });

            if (sum === target) {
                steps.push({
                    kind: 'FOUND',
                    payload: { indices: [i, j], message: `Match found! Returning indices [${i}, ${j}].`, line: 4 }
                });
                return steps;
            }
        }
    }

    steps.push({
        kind: 'RETURN',
        payload: { message: 'No solution found.', line: 8 }
    });

    return steps;
};
