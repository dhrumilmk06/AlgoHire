import type { Step } from "../../../types/Algorithm"
import { mapCellToVisual } from "../../../families/graph/problems/200/adapter"

export const numIslandsCode = `class Solution {
    public int numIslands(char[][] grid) {
        if (grid == null || grid.length == 0) return 0;

        int count = 0;
        for (int i = 0; i < grid.length; i++) {
            for (int j = 0; j < grid[0].length; j++) {
                if (grid[i][j] == '1') {
                    dfs(grid, i, j);
                    count++;
                }
            }
        }
        return count;
    }

    private void dfs(char[][] grid, int i, int j) {
        if (i < 0 || j < 0 || i >= grid.length ||
            j >= grid[0].length || grid[i][j] == '0') {
            return;
        }

        grid[i][j] = '0';

        dfs(grid, i + 1, j);
        dfs(grid, i - 1, j);
        dfs(grid, i, j + 1);
        dfs(grid, i, j - 1);
    }
}`


export const runNumIslands = (args: any[]): Step[] => {
    const steps: Step[] = []

    // STEP 5: RESET STATE (Local Only)
    // Clear previous steps is implicit by creating new array
    // Clear local grid state by creating deep copy
    // Ensure fresh adapter mapping: Logic is pure, so mapping is fresh per run

    // Unpack arguments. The parser wraps inputs in an array, so for this problem args[0] is the grid.
    // Check if args is the grid itself or if it is wrapped.
    // Based on parseInput logic: return JSON.parse(`[${trimmed}]`) -> produces [grid]
    const inputGrid = (args.length > 0 && Array.isArray(args[0])) ? args[0] as string[][] : [] as string[][]

    // Deep copy to not mutate the original input for visualization logic
    const grid = inputGrid.map(row => [...row])
    let count = 0

    if (!grid || grid.length === 0) {
        return [{
            type: 'RETURN',
            message: 'Grid is empty. Returning 0.',
            value: 0,
            customValues: { visualType: mapCellToVisual('?', 'active') }
        }]
    }

    const rows = grid.length
    const cols = grid[0].length

    const dfs = (r: number, c: number) => {
        // Base case checks
        // We add a 'CHECK_CELL' step to visualize inspecting the cell
        steps.push({
            type: 'POINTER', // Reusing POINTER for highlighting current cell check
            indices: [r, c], // Note: We might need to store 2D indices differently if indices expects number[]. For now assuming we'll flatten or handle in component.
            // Actually, let's store as [r, c] and update component to handle Tuple
            message: `Checking cell [${r}, ${c}]`,
            customValues: { visualType: mapCellToVisual('?', 'active') },
            line: 18 // "if (i < 0 || ...)"
        })

        if (r < 0 || c < 0 || r >= rows || c >= cols) {
            steps.push({
                type: 'RETURN',
                message: `Cell [${r}, ${c}] is out of bounds. Return.`,
                line: 18,
                customValues: { visualType: mapCellToVisual('?', 'active') }
            })
            return
        }

        if (grid[r][c] === '0') {
            steps.push({
                type: 'RETURN',
                indices: [r, c],
                message: `Cell [${r}, ${c}] is water ('0'). Return.`,
                line: 18,
                customValues: { visualType: mapCellToVisual('0', 'water') }
            })
            return
        }

        // It is '1', so mark it
        // MUTATE STEP
        grid[r][c] = '0'
        steps.push({
            type: 'MUTATE_GRID',
            indices: [r, c],
            value: '0',
            message: `Marking [${r}, ${c}] as visited (Water '0')`,
            customValues: { visualType: mapCellToVisual('0', 'visited') },
            line: 23 // "grid[i][j] = '0';"
        })

        // Recursive calls
        // Recursive calls
        // Down
        steps.push({ type: 'DFS_CALL', message: `DFS Down -> [${r + 1}, ${c}]`, line: 25, customValues: { visualType: mapCellToVisual('0', 'visited') } })
        dfs(r + 1, c)

        // Up
        steps.push({ type: 'DFS_CALL', message: `DFS Up -> [${r - 1}, ${c}]`, line: 26, customValues: { visualType: mapCellToVisual('0', 'visited') } })
        dfs(r - 1, c)

        // Right
        steps.push({ type: 'DFS_CALL', message: `DFS Right -> [${r}, ${c + 1}]`, line: 27, customValues: { visualType: mapCellToVisual('0', 'visited') } })
        dfs(r, c + 1)

        // Left
        steps.push({ type: 'DFS_CALL', message: `DFS Left -> [${r}, ${c - 1}]`, line: 28, customValues: { visualType: mapCellToVisual('0', 'visited') } })
        dfs(r, c - 1)
    }

    steps.push({
        type: 'COMPUTE',
        message: 'Starting Grid Scan...',
        line: 6,
        customValues: { visualType: mapCellToVisual('?', 'active') }
    })

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            steps.push({
                type: 'POINTER',
                indices: [i, j],
                message: `Scanning [${i}, ${j}]...`,
                customValues: { visualType: mapCellToVisual(grid[i][j], 'active') },
                line: 8
            })

            if (grid[i][j] === '1') {
                // Increment count BEFORE DFS
                count++

                // Emit ISLAND_DISCOVERED specifically to trigger persistent state update
                steps.push({
                    type: 'ISLAND_DISCOVERED',
                    indices: [i, j],
                    message: `New Island Discovered at [${i}, ${j}]!`,
                    line: 12,
                    customValues: {
                        islandCount: count,
                        visualType: mapCellToVisual('1', 'land')
                    } // This value is now "latched" by the visualizer
                })

                steps.push({ type: 'FOUND', indices: [i, j], message: 'Starting DFS traversal...', line: 11, customValues: { visualType: mapCellToVisual('1', 'land') } })

                // Start DFS
                dfs(i, j)

                // No need to emit count increment here anymore, as it was done on discovery.
                steps.push({
                    type: 'COMPUTE',
                    message: `Island #${count} fully explored.`,
                    line: 12,
                    customValues: { visualType: mapCellToVisual('0', 'visited') }
                })
            }
        }
    }

    steps.push({
        type: 'RETURN',
        message: `Finished. Total Islands: ${count}`,
        value: count,
        line: 14,
        customValues: { visualType: mapCellToVisual('?', 'active') }
    })

    return steps
}
