export type StepType =
    | 'POINTER'
    | 'COMPARE'
    | 'FOUND'
    | 'RETURN'
    | 'READ'
    | 'COMPUTE'
    | 'CREATE_NODE'
    | 'LINK'
    | 'MOVE_POINTER'
    | 'MUTATE_GRID' // NEW
    | 'DFS_CALL'    // NEW
    | 'ISLAND_DISCOVERED' // NEW: For persistent count updates
    | 'MISMATCH'
    | 'CENTER_SELECTED'
    | 'UPDATE_GLOBAL'
    | 'INITIAL'
    | 'FINISHED'

export interface Step {
    type: StepType
    // Array specific
    indices?: number[] // Can also hold [row, col] for grid
    targetIndex?: number

    // Linked List specific
    pointers?: {
        l1?: number | null // Index/ID of node l1 is pointing to
        l2?: number | null
        tail?: number | null
        curr?: number | null
        left?: number // Sliding window left
        right?: number // Sliding window right
    }
    // For Multi-Array steps
    rowHighlights?: { [rowIndex: number]: number[] }
    values?: {
        digit1?: number
        digit2?: number
        sum?: number
        digit?: number
        carry?: number
    }
    index?: number // Index in result list
    source?: number // Source index for LINK
    target?: number // Target index for LINK
    newNodeVal?: number // For CREATE_NODE

    // Common
    value?: number | string
    message: string
    highlight?: boolean
    line?: number

    // Generic extensions
    customValues?: Record<string, any> // Flexible storage for things like islandCount
}

export type AlgorithmVariant = {
    id: string
    label: string
    code: string
    // Generalized run function: accepts any input, returns Steps
    run: (input: any, ...args: any[]) => Step[]
}

// Helper for Linked List algorithms
export class ListNode {
    val: number
    next: ListNode | null
    id: string // Visual ID

    constructor(val?: number, next?: ListNode | null) {
        this.val = (val === undefined ? 0 : val)
        this.next = (next === undefined ? null : next)
        this.id = Math.random().toString(36).substr(2, 9)
    }
}
