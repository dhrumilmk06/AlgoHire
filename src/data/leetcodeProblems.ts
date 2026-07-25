import type { LeetCodeProblem } from '../types/LeetCodeProblem'
import { twoSumVariants, twoSumMeta, addTwoNumbersVariants, longestSubstringMeta, longestSubstringVariants, medianSortedArraysMeta, medianSortedArraysVariants } from '../algorithms/leetcode'
import { numIslandsCode, runNumIslands } from '../algorithms/leetcode'
import { longestPalindromeMeta, longestPalindromeCode, runLongestPalindrome } from '../families/string/problems/5';


// Explicitly typed array with safety check on imported meta
const getTwoSumProblem = (): LeetCodeProblem => ({
    leetcodeId: 1,
    title: twoSumMeta ? twoSumMeta.title : 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description: twoSumMeta ? twoSumMeta.description : 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    inputDescription: 'An array of integers `nums` and an integer `target`.',
    outputDescription: 'Indices of the two numbers such that they add up to target.',
    examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
        { input: 'nums = [3,3], target = 6', output: '[0,1]' }
    ],
    constraints: [
        '2 <= nums.length <= 104',
        '-109 <= nums[i] <= 109',
        '-109 <= target <= 109',
        'Only one valid answer exists.'
    ],
    variants: twoSumVariants || {},
    defaultInput: twoSumMeta ? twoSumMeta.defaultInput : '2, 7, 11, 15',
    defaultTarget: twoSumMeta ? twoSumMeta.defaultTarget : 9,
    requiresTarget: true
})

const getAddTwoNumbersProblem = (): LeetCodeProblem => ({
    leetcodeId: 2,
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    tags: ['Linked List', 'Math', 'Recursion'],
    description: 'You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\nYou may assume the two numbers do not contain any leading zero, except the number 0 itself.',
    inputDescription: 'Two non-empty linked lists `l1` and `l2` representing two non-negative integers.',
    outputDescription: 'The sum of the two numbers as a linked list.',
    examples: [
        { input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7,0,8]', explanation: '342 + 465 = 807.' },
        { input: 'l1 = [0], l2 = [0]', output: '[0]' },
        { input: 'l1 = [9,9,9,9,9,9,9], l2 = [9,9,9,9]', output: '[8,9,9,9,0,0,0,1]' }
    ],
    constraints: [
        'The number of nodes in each linked list is in the range [1, 100].',
        '0 <= Node.val <= 9',
        'It is guaranteed that the list represents a number that does not have leading zeros.'
    ],
    variants: addTwoNumbersVariants || {},
    defaultInput: '[2,4,3], [5,6,4]',
    defaultTarget: 0, // Not used but required by type
    visualizerType: 'linked-list'
})


const getLongestSubstringProblem = (): LeetCodeProblem => ({
    leetcodeId: 3,
    title: longestSubstringMeta.title,
    difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window', 'Two Pointers'],
    description: longestSubstringMeta.description,
    inputDescription: 'A string `s`.',
    outputDescription: 'The length of the longest substring without repeating characters.',
    examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
        { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' }
    ],
    constraints: [
        '0 <= s.length <= 5 * 10^4',
        's consists of English letters, digits, symbols and spaces.'
    ],
    variants: longestSubstringVariants || {},
    defaultInput: longestSubstringMeta.defaultInput,
    defaultTarget: 0 // Not used
})

const getMedianSortedArraysProblem = (): LeetCodeProblem => ({
    leetcodeId: 4,
    title: medianSortedArraysMeta.title,
    difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    description: medianSortedArraysMeta.description,
    inputDescription: 'Two sorted arrays `nums1` and `nums2`.',
    outputDescription: 'The median value (double).',
    examples: [
        { input: 'nums1 = [1,3], nums2 = [2]', output: '2.00000', explanation: 'merged array = [1,2,3] and median is 2.' },
        { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.50000', explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.' }
    ],
    constraints: [
        'nums1.length == m',
        'nums2.length == n',
        '0 <= m <= 1000',
        '0 <= n <= 1000',
        '1 <= m + n <= 2000'
    ],
    variants: medianSortedArraysVariants || {},
    defaultInput: medianSortedArraysMeta.defaultInput,
    defaultTarget: 0,
    visualizerType: 'array-isolated'
})

const getNumIslandsProblem = (): LeetCodeProblem => ({
    leetcodeId: 200,
    title: 'Number of Islands',
    difficulty: 'Medium',
    tags: ['Array', 'Recursion', 'BFS'], // Used standard tags
    description: 'Given an m x n 2d grid map of "1"s (land) and "0"s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.',
    inputDescription: 'An m x n 2D grid of characters "1" (land) and "0" (water).',
    outputDescription: 'An integer representing the number of islands.',
    examples: [
        {
            input: 'grid = [\n  ["1","1","1","1","0"],\n  ["1","1","0","1","0"],\n  ["1","1","0","0","0"],\n  ["0","0","0","0","0"]\n]',
            output: '1'
        },
        {
            input: 'grid = [\n  ["1","1","0","0","0"],\n  ["1","1","0","0","0"],\n  ["0","0","1","0","0"],\n  ["0","0","0","1","1"]\n]',
            output: '3'
        }
    ],
    constraints: [
        'm == grid.length',
        'n == grid[i].length',
        '1 <= m, n <= 300',
        'grid[i][j] is "0" or "1".'
    ],
    variants: {
        'dfs': {
            id: 'dfs',
            label: 'DFS Approach',
            code: numIslandsCode,
            run: runNumIslands
        }
    },
    defaultInput: `[
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]`,
    defaultTarget: 0,
    visualizerType: 'island-grid'
})

const getLongestPalindromeProblem5 = (): LeetCodeProblem => ({
    leetcodeId: 5,
    title: longestPalindromeMeta.title,
    difficulty: 'Medium',
    tags: ['String', 'Dynamic Programming', 'Two Pointers'],
    description: longestPalindromeMeta.description,
    inputDescription: 'A string `s`.',
    outputDescription: 'The longest palindromic substring.',
    examples: [
        { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
        { input: 's = "cbbd"', output: '"bb"' }
    ],
    constraints: [
        '1 <= s.length <= 1000',
        's consist of only digits and English letters.'
    ],
    variants: {
        'expand': {
            id: 'expand',
            label: 'Expand Around Center',
            code: longestPalindromeCode,
            run: runLongestPalindrome
        }
    },
    defaultInput: longestPalindromeMeta.defaultInput,
    defaultTarget: 0,
    visualizerType: 'string-palindrome' // Must match mapping in LeetCodeLevel if we weren't using Registry? 
    // Actually we ARE using registry logic in LeetCodeLevel for problems that have a definition there.
    // So visualizerType string is less critical but good for legacy safety.
})

export const problems: LeetCodeProblem[] = [
    getTwoSumProblem(),
    getAddTwoNumbersProblem(),
    getLongestSubstringProblem(),
    getMedianSortedArraysProblem(),
    getNumIslandsProblem(),
    getLongestPalindromeProblem5()
]
