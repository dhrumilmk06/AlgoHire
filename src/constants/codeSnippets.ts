export const BUBBLE_SORT_CODE = `// Bubble Sort Algorithm
for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
        // Compare adjacent elements
        if (arr[j] > arr[j + 1]) {
            // Swap if they are in wrong order
            let temp = arr[j];
            arr[j] = arr[j + 1];
            arr[j + 1] = temp;
        }
    }
}`;

export const INSERTION_SORT_CODE = `// Insertion Sort Algorithm
for (let i = 1; i < n; i++) {
    let key = arr[i];
    let j = i - 1;

    // Move elements of arr[0..i-1], that are
    // greater than key, to one position ahead
    while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        j = j - 1;
    }
    arr[j + 1] = key;
}`;

export const SELECTION_SORT_CODE = `// Selection Sort Algorithm
for (let i = 0; i < n - 1; i++) {
    let min_idx = i;
    for (let j = i + 1; j < n; j++) {
        if (arr[j] < arr[min_idx]) {
            min_idx = j;
        }
    }
    // Swap the found minimum element with the first element
    let temp = arr[min_idx];
    arr[min_idx] = arr[i];
    arr[i] = temp;
}`;

export const MERGE_SORT_CODE = `// Merge Sort Algorithm
function merge(arr, l, m, r) {
    // ... setup L[] and R[] ...
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    // ... copy remaining elements ...
}

function mergeSort(arr, l, r) {
    if (l >= r) return;
    let m = l + parseInt((r - l) / 2);
    mergeSort(arr, l, m);
    mergeSort(arr, m + 1, r);
    merge(arr, l, m, r);
}`;

export const BFS_CODE = `// Breadth-First Search (BFS)
const queue = [startNode];
const visited = new Set();
visited.add(startNode);

while (queue.length > 0) {
    const node = queue.shift();

    // Check if we reached the goal
    if (node === endNode) {
        return reconstructPath(node);
    }

    // Explore neighbors (Up, Down, Left, Right)
    for (const neighbor of getNeighbors(node)) {
        if (!visited.has(neighbor) && !isWall(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
        }
    }
}`;
