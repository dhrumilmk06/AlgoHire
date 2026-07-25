import type { Step } from "../../../../types/Algorithm";

export function explainIslandStep(step: Step): string {
    const { type, indices } = step;
    const [row, col] = indices || [];

    switch (type) {
        case 'POINTER':
            // Distinguish between initial scanning and DFS checks based on context if possible, 
            // but POINTER is mostly used for "scanning" in the outer loop in numIslands.ts
            // In numIslands.ts:
            // Line 75: POINTER reused for highlighting current cell check in DFS (Wait, line 75 says "Reusing POINTER for highlighting current cell check")
            // Line 139: POINTER used for "Scanning [i, j]..."

            // If we want to be specific, we might just say we are checking this cell.
            return `We check the cell at row ${row}, column ${col}. Is it land ('1') or water ('0')?`;

        case 'ISLAND_DISCOVERED':
            return `We found a piece of unvisited land at [${row}, ${col}]! This starts a new island. We increment our island counter.`;

        case 'FOUND':
            // Used for "Starting DFS traversal..."
            return `Now we need to find all land connected to this cell. We start a Depth-First Search (DFS) to visit the entire island.`;

        case 'MUTATE_GRID':
            // "Marking [r, c] as visited"
            return `We mark the land at [${row}, ${col}] as visited (turning it to '0') so we don't count it again later.`;

        case 'DFS_CALL':
            // "DFS Down/Up/Right/Left -> ..."
            // The message usually says direction. Let's try to parse or just give a generic move explanation.
            // step.message in numIslands.ts is like "DFS Down -> ..."
            if (step.message.includes("Down")) return `We move DOWN to check the neighbor at [${row + 1}, ${col}].`;
            if (step.message.includes("Up")) return `We move UP to check the neighbor at [${row - 1}, ${col}].`;
            if (step.message.includes("Right")) return `We move RIGHT to check the neighbor at [${row}, ${col + 1}].`;
            if (step.message.includes("Left")) return `We move LEFT to check the neighbor at [${row}, ${col - 1}].`;
            return `We move recursively to check a neighboring cell.`;

        case 'RETURN':
            // "Cell ... is out of bounds" or "Cell ... is water" or "Finished"
            if (step.message.includes("out of bounds")) {
                return `This coordinate is outside the grid boundaries, so we stop here and return.`;
            }
            if (step.message.includes("is water") || step.message.includes("visited")) { // Water '0' or visited '0'
                return `This cell is water (or already visited). It's not part of a new unvisited section of the island, so we return.`;
            }
            if (step.message.includes("Finished")) {
                return `We have scanned the entire grid. The total number of islands found is the final answer.`;
            }
            return `Done with this step. returning.`;

        case 'COMPUTE':
            // "Island #count fully explored."
            if (step.message.includes("fully explored")) {
                return `We have finished exploring this entire island. We return to the main loop to continue scanning for more islands.`;
            }
            if (step.message.includes("Starting Grid Scan")) {
                return `We start by scanning the grid row by row, from top-left, looking for '1's (land).`;
            }
            return step.message;

        default:
            return step.message; // Fallback to the dev message if no specific explanation
    }
}
