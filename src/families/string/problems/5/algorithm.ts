import type { Step } from '../../../../types/Algorithm';

export const longestPalindromeCode = `class Solution {
    public String longestPalindrome(String s) {
        if (s == null || s.length() < 1) return "";
        int start = 0, end = 0;
        for (int i = 0; i < s.length(); i++) {
            int len1 = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i + 1);
            int len = Math.max(len1, len2);
            if (len > end - start) {
                start = i - (len - 1) / 2;
                end = i + len / 2;
            }
        }
        return s.substring(start, end + 1);
    }
    
    private int expandAroundCenter(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }
}`;

export function runLongestPalindrome(input: any): Step[] {
    const s = Array.isArray(input) ? input.join('') : String(input);
    const steps: Step[] = [];

    if (!s || s.length === 0) return [];

    let maxStart = 0;
    let maxEnd = 0; // inclusive

    // Initial state
    steps.push({
        type: 'INITIAL',
        message: 'Starting execution. Global best range is [0, 0].',
        customValues: {
            globalBestRange: [0, 0],
            currentRange: null,
            centerType: null,
            left: -1,
            right: -1,
            isMatch: false,
            indices: []
        }
    });

    for (let i = 0; i < s.length; i++) {
        // Odd Length (Center is i)
        steps.push({
            type: 'CENTER_SELECTED',
            message: `Selecting center '${s[i]}' at index ${i} (Odd length check).`,
            customValues: { centerType: 'odd', left: i, right: i, indices: [i] }
        });

        let l = i, r = i;
        while (l >= 0 && r < s.length && s[l] === s[r]) {
            steps.push({
                type: 'COMPARE',
                message: `Comparing indices ${l} ('${s[l]}') and ${r} ('${s[r]}'). Match! Expanding.`,
                indices: [l, r], // This highlights them
                customValues: {
                    left: l,
                    right: r,
                    isMatch: true,
                    currentRange: [l, r]
                }
            });

            // Update global if better
            if (r - l > maxEnd - maxStart) {
                maxStart = l;
                maxEnd = r;
                steps.push({
                    type: 'UPDATE_GLOBAL',
                    message: `New longest palindrome found: "${s.substring(l, r + 1)}" ([${l}, ${r}]).`,
                    customValues: {
                        globalBestRange: [maxStart, maxEnd],
                        isMatch: true
                    }
                });
            }

            l--;
            r++;
        }

        // Mismatch or Bound
        if (l >= 0 && r < s.length) {
            steps.push({
                type: 'MISMATCH',
                message: `Comparing indices ${l} ('${s[l]}') and ${r} ('${s[r]}'). Mismatch! Stop expansion.`,
                indices: [l, r],
                customValues: {
                    left: l,
                    right: r,
                    isMatch: false,
                    currentRange: [l + 1, r - 1] // The last valid one
                }
            });
        }

        // Even Length (Center is i, i+1)
        if (i < s.length - 1) {
            steps.push({
                type: 'CENTER_SELECTED',
                message: `Selecting center between '${s[i]}' and '${s[i + 1]}' (indices ${i}, ${i + 1}). (Even length check).`,
                customValues: { centerType: 'even', left: i, right: i + 1, indices: [i, i + 1] }
            });

            l = i;
            r = i + 1;
            while (l >= 0 && r < s.length && s[l] === s[r]) {
                steps.push({
                    type: 'COMPARE',
                    message: `Comparing indices ${l} ('${s[l]}') and ${r} ('${s[r]}'). Match! Expanding.`,
                    indices: [l, r],
                    customValues: {
                        left: l,
                        right: r,
                        isMatch: true,
                        currentRange: [l, r]
                    }
                });

                if (r - l > maxEnd - maxStart) {
                    maxStart = l;
                    maxEnd = r;
                    steps.push({
                        type: 'UPDATE_GLOBAL',
                        message: `New longest palindrome found: "${s.substring(l, r + 1)}" ([${l}, ${r}]).`,
                        customValues: {
                            globalBestRange: [maxStart, maxEnd],
                            isMatch: true
                        }
                    });
                }
                l--;
                r++;
            }

            // Mismatch or Bound
            if (l >= 0 && r < s.length) {
                steps.push({
                    type: 'MISMATCH',
                    message: `Comparing indices ${l} ('${s[l]}') and ${r} ('${s[r]}'). Mismatch! Stop expansion.`,
                    indices: [l, r],
                    customValues: {
                        left: l,
                        right: r,
                        isMatch: false,
                        currentRange: [l + 1, r - 1]
                    }
                });
            }
        }
    }

    steps.push({
        type: 'FINISHED',
        message: `Finished. Longest palindrome is "${s.substring(maxStart, maxEnd + 1)}".`,
        customValues: {
            globalBestRange: [maxStart, maxEnd],
            currentRange: null,
            left: -1,
            right: -1
        }
    });

    return steps;
}
