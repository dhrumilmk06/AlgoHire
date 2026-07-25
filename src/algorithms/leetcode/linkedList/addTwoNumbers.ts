import type { Step, AlgorithmVariant } from '../../../types/Algorithm'
import { ListNode } from '../../../types/Algorithm'

const javaCode = `
class Solution {
    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {
        ListNode dummyHead = new ListNode(0);
        ListNode tail = dummyHead;
        int carry = 0;

        while (l1 != null || l2 != null || carry != 0) {
            int digit1 = (l1 != null) ? l1.val : 0;
            int digit2 = (l2 != null) ? l2.val : 0;

            int sum = digit1 + digit2 + carry;
            int digit = sum % 10;
            carry = sum / 10;

            ListNode newNode = new ListNode(digit);
            tail.next = newNode;
            tail = tail.next;

            l1 = (l1 != null) ? l1.next : null;
            l2 = (l2 != null) ? l2.next : null;
        }

        return dummyHead.next;
    }
}
`

const parseLinkedList = (arr: number[]): ListNode | null => {
    if (arr.length === 0) return null
    const head = new ListNode(arr[0])
    let current = head
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i])
        current = current.next
    }
    return head
}

const runAddTwoNumbers = (lists: number[][], _target: number): Step[] => {
    const steps: Step[] = []

    // Safety check
    if (!lists || lists.length < 2) return [{ type: 'RETURN', message: 'Invalid input: Need two lists', line: 1 }]

    let l1: ListNode | null = parseLinkedList(lists[0])
    let l2: ListNode | null = parseLinkedList(lists[1])

    // Track indices for visualization
    let l1Index = 0
    let l2Index = 0

    // Dummy Head Construction
    const dummyHead = new ListNode(0)
    let tail: ListNode | null = dummyHead
    let carry = 0
    let resultCount = 0 // Track size of result list (excluding dummy)

    steps.push({
        type: 'CREATE_NODE',
        message: 'Initialized dummyHead(0) and tail pointer.',
        pointers: { l1: l1Index, l2: l2Index, tail: -1 }, // -1 for dummy head in result
        line: 3
    })

    while (l1 !== null || l2 !== null || carry !== 0) {
        steps.push({
            type: 'POINTER',
            message: `Loop start. l1: ${l1?.val ?? 'null'}, l2: ${l2?.val ?? 'null'}, carry: ${carry}`,
            pointers: { l1: l1 ? l1Index : null, l2: l2 ? l2Index : null, tail: resultCount - 1 }, // Tail points to last real node
            values: { carry: carry },
            line: 7
        })

        const digit1 = l1 ? l1.val : 0
        const digit2 = l2 ? l2.val : 0

        steps.push({
            type: 'READ',
            message: `Read values: digit1=${digit1}, digit2=${digit2}`,
            pointers: { l1: l1 ? l1Index : null, l2: l2 ? l2Index : null },
            values: { digit1, digit2, carry },
            line: 8
        })

        const sum = digit1 + digit2 + carry
        const digit = sum % 10
        const nextCarry = Math.floor(sum / 10)

        steps.push({
            type: 'COMPUTE',
            message: `Compute: ${digit1} + ${digit2} + ${carry} = ${sum}. Digit: ${digit}, New Carry: ${nextCarry}`,
            values: { sum, digit, carry: nextCarry },
            line: 11
        })

        carry = nextCarry

        const newNode = new ListNode(digit)
        steps.push({
            type: 'CREATE_NODE',
            message: `Created new node with value ${digit}`,
            value: digit,
            index: resultCount, // Index in the result list
            line: 15
        })

        if (tail) {
            tail.next = newNode
            steps.push({
                type: 'LINK',
                message: `Linked tail.next to new node (${digit})`,
                source: resultCount - 1, // Index of the node tail was pointing to
                target: resultCount, // Index of the newly created node
                line: 16
            })

            tail = tail.next
            resultCount++ // Incremented result size

            steps.push({
                type: 'MOVE_POINTER',
                message: 'Advanced tail pointer.',
                pointers: { tail: resultCount - 1 }, // Point to new last node
                line: 17
            })
        }

        if (l1) {
            l1 = l1.next
            l1Index++
        }
        if (l2) {
            l2 = l2.next
            l2Index++
        }

        steps.push({
            type: 'MOVE_POINTER',
            message: 'Advanced l1 and l2 pointers.',
            pointers: { l1: l1 ? l1Index : null, l2: l2 ? l2Index : null },
            line: 19
        })
    }

    steps.push({
        type: 'RETURN',
        message: 'Finished! Returning dummyHead.next (the result list).',
        line: 24
    })

    return steps
}

export const addTwoNumbersVariants: Record<string, AlgorithmVariant> = {
    standard: {
        id: 'standard',
        label: 'Standard Approach (O(max(n,m)))',
        code: javaCode,
        run: runAddTwoNumbers
    }
}
