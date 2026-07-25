import { supabase } from '../auth/supabaseClient';
import type { SolveProblem } from '../types/SolveProblem';
import { parseProblemIdFromDb } from './sessionService';

// ---------------------------------------------------------------------------
// Local fallback data — used when Supabase table doesn't exist or is empty.
// Covers the 6 existing visualizer problems with basic test_cases + starter_code.
// ---------------------------------------------------------------------------
const LOCAL_PROBLEMS: SolveProblem[] = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    test_cases: [
      { input: '2 7 11 15\n9', expected_output: '0 1' },
      { input: '3 2 4\n6', expected_output: '1 2' },
      { input: '3 3\n6', expected_output: '0 1' },
    ],
    starter_code: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Your solution here
}

// Parse stdin: first line = space-separated nums, second line = target
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const nums = lines[0].split(' ').map(Number);
const target = Number(lines[1]);
const result = twoSum(nums, target);
console.log(result.join(' '));`,
      python: `import sys

def two_sum(nums, target):
    # Your solution here
    pass

data = sys.stdin.read().strip().split('\\n')
nums = list(map(int, data[0].split()))
target = int(data[1])
result = two_sum(nums, target)
print(' '.join(map(str, result)))`,
      java: `import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int[] nums = Arrays.stream(sc.nextLine().trim().split(" ")).mapToInt(Integer::parseInt).toArray();
        int target = sc.nextInt();
        int[] res = new Solution().twoSum(nums, target);
        System.out.println(res[0] + " " + res[1]);
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Your solution here
    return {};
}

int main() {
    string line; getline(cin, line);
    istringstream ss(line);
    vector<int> nums; int x;
    while(ss >> x) nums.push_back(x);
    int target; cin >> target;
    auto res = twoSum(nums, target);
    cout << res[0] << " " << res[1] << endl;
}`,
    },
  },
  {
    id: 3,
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    description:
      'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    test_cases: [
      { input: 'abcabcbb', expected_output: '3' },
      { input: 'bbbbb', expected_output: '1' },
      { input: 'pwwkew', expected_output: '3' },
    ],
    starter_code: {
      javascript: `function lengthOfLongestSubstring(s) {
  // Your solution here
}

const s = require('fs').readFileSync('/dev/stdin','utf8').trim();
console.log(lengthOfLongestSubstring(s));`,
      python: `import sys

def length_of_longest_substring(s):
    # Your solution here
    pass

s = sys.stdin.read().strip()
print(length_of_longest_substring(s))`,
      java: `import java.util.*;

public class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(new Solution().lengthOfLongestSubstring(sc.nextLine().trim()));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int lengthOfLongestSubstring(string s) {
    // Your solution here
    return 0;
}

int main() {
    string s; getline(cin, s);
    cout << lengthOfLongestSubstring(s) << endl;
}`,
    },
  },
  {
    id: 200,
    title: 'Number of Islands',
    difficulty: 'Medium',
    tags: ['Array', 'BFS', 'DFS'],
    description:
      'Given an m x n 2d grid map of "1"s (land) and "0"s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      { input: 'grid with 1 island', output: '1' },
      { input: 'grid with 3 islands', output: '3' },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    test_cases: [
      { input: '4 5\n1 1 1 1 0\n1 1 0 1 0\n1 1 0 0 0\n0 0 0 0 0', expected_output: '1' },
      { input: '4 5\n1 1 0 0 0\n1 1 0 0 0\n0 0 1 0 0\n0 0 0 1 1', expected_output: '3' },
    ],
    starter_code: {
      javascript: `function numIslands(grid) {
  // Your solution here
}

const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
const [m, n] = lines[0].split(' ').map(Number);
const grid = lines.slice(1).map(l => l.split(' '));
console.log(numIslands(grid));`,
      python: `import sys

def num_islands(grid):
    # Your solution here
    pass

data = sys.stdin.read().strip().split('\\n')
m, n = map(int, data[0].split())
grid = [row.split() for row in data[1:]]
print(num_islands(grid))`,
      java: `import java.util.*;

public class Solution {
    public int numIslands(char[][] grid) {
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt(); sc.nextLine();
        char[][] grid = new char[m][n];
        for(int i=0;i<m;i++){
            String[] row = sc.nextLine().trim().split(" ");
            for(int j=0;j<n;j++) grid[i][j]=row[j].charAt(0);
        }
        System.out.println(new Solution().numIslands(grid));
    }
}`,
      cpp: `#include <bits/stdc++.h>
using namespace std;

int numIslands(vector<vector<char>>& grid) {
    return 0;
}

int main(){
    int m,n; cin>>m>>n;
    vector<vector<char>> grid(m,vector<char>(n));
    for(int i=0;i<m;i++) for(int j=0;j<n;j++){int x;cin>>x;grid[i][j]='0'+x;}
    cout<<numIslands(grid)<<endl;
}`,
    },
  },
];

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

export async function fetchProblems(): Promise<SolveProblem[]> {
  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.info('[problemsService] Falling back to local problem data.');
      return LOCAL_PROBLEMS;
    }

    return data as SolveProblem[];
  } catch {
    return LOCAL_PROBLEMS;
  }
}

export async function fetchProblemById(id: string | number): Promise<SolveProblem | null> {
  const normId = parseProblemIdFromDb(id) ?? id;
  // First check local fallback (fast)
  const local = LOCAL_PROBLEMS.find((p) => String(p.id) === String(normId));

  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('id', normId)
      .single();

    if (error || !data) return local ?? null;
    return data as SolveProblem;
  } catch {
    return local ?? null;
  }
}
