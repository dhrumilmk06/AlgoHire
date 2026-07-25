
export type DSType = 'ARRAY' | 'LINKED_LIST' | 'STACK' | 'QUEUE' | 'TREE' | 'GRAPH' | 'HASH' | 'HEAP';

interface Complexity {
    access: string;
    search: string;
    insert: string;
    delete: string;
}

interface DSInfoItem {
    title: string;
    definition: string;
    complexity: Complexity;
    analogy: string;
}

export const DS_INFO: Record<DSType, DSInfoItem> = {
    ARRAY: {
        title: 'Array',
        definition: 'A collection of elements identified by index or key, stored in contiguous memory locations. It allows random access but fixed size.',
        complexity: {
            access: 'O(1)',
            search: 'O(n)',
            insert: 'O(n)',
            delete: 'O(n)'
        },
        analogy: 'Like a row of numbered mailboxes. You can instantly find box #5, but adding a new box in the middle requires moving everyone else over.'
    },
    LINKED_LIST: {
        title: 'Linked List',
        definition: 'A linear collection of data elements where each element points to the next. It allows efficient insertion and deletion but sequential access.',
        complexity: {
            access: 'O(n)',
            search: 'O(n)',
            insert: 'O(1)',
            delete: 'O(1)'
        },
        analogy: 'Like a scavenger hunt. You only know where the first item is, and it gives you a clue to find the next one.'
    },
    STACK: {
        title: 'Stack',
        definition: 'A LIFO (Last In, First Out) data structure. Elements are added and removed from the same end, called the "top".',
        complexity: {
            access: 'O(n)',
            search: 'O(n)',
            insert: 'O(1)',
            delete: 'O(1)'
        },
        analogy: 'Like a stack of plates. You can only take the top plate off, and you must put a new plate on the very top.'
    },
    QUEUE: {
        title: 'Queue',
        definition: 'A FIFO (First In, First Out) data structure. Elements are added at the rear and removed from the front.',
        complexity: {
            access: 'O(n)',
            search: 'O(n)',
            insert: 'O(1)',
            delete: 'O(1)'
        },
        analogy: 'Like a line at a grocery store. The first person in line is the first one to be served.'
    },
    TREE: {
        title: 'Binary Tree',
        definition: 'A hierarchical structure where each node has at most two children. Used for hierarchical data storage and efficient searching (BST).',
        complexity: {
            access: 'O(log n)',
            search: 'O(log n)',
            insert: 'O(log n)',
            delete: 'O(log n)'
        },
        analogy: 'Like a family tree or a corporate organizational chart, branching out from a single root.'
    },
    GRAPH: {
        title: 'Graph',
        definition: 'A collection of nodes (vertices) connected by edges. It represents relationships between objects, potentially cyclic.',
        complexity: {
            access: 'Varies',
            search: 'O(V+E)',
            insert: 'O(1)',
            delete: 'O(V+E)'
        },
        analogy: 'Like a map of cities plugged into a GPS. Roads (edges) connect cities (nodes) in a complex network.'
    },
    HASH: {
        title: 'Hash Table',
        definition: 'A structure that maps keys to values using a hash function. It offers very fast average-case access.',
        complexity: {
            access: 'O(1)',
            search: 'O(1)',
            insert: 'O(1)',
            delete: 'O(1)'
        },
        analogy: 'Like a library index. You know exactly which shelf to go to based on the book code.'
    },
    HEAP: {
        title: 'Heap',
        definition: 'A specialized tree-based structure that satisfies the heap property (max-heap or min-heap). Great for priority queues.',
        complexity: {
            access: 'O(n)',
            search: 'O(n)',
            insert: 'O(log n)',
            delete: 'O(log n)'
        },
        analogy: 'Like a triage system in a hospital. The most critical patient (highest priority) is always seen next.'
    }
};
