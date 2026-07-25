
import { useMemo } from 'react'
import { LinkedListNode } from '../3d/LinkedListNode'
import { Text as ThreeText } from '@react-three/drei'
import type { Step } from '../../types/Algorithm'

interface LinkedListVisualizerProps {
    visualData: any
    steps: Step[]
    currentStepIndex: number
}

export const LinkedListVisualizer = ({ visualData, steps, currentStepIndex }: LinkedListVisualizerProps) => {

    const currentStep = (currentStepIndex >= 0 && currentStepIndex < steps.length) ? steps[currentStepIndex] : null

    const derivedResultList = useMemo(() => {
        if (!steps.length || currentStepIndex < 0) return []

        const nodes: number[] = []
        // Replay steps up to current index
        for (let i = 0; i <= currentStepIndex; i++) {
            const s = steps[i]
            if (s.type === 'CREATE_NODE' && s.value !== undefined && typeof s.value === 'number') {
                nodes.push(s.value)
            }
        }
        return nodes
    }, [steps, currentStepIndex])

    if (!Array.isArray(visualData) || visualData.length < 2) return null

    return (
        <>
            {/* L1 Input */}
            <group position={[-6, 4, 0]}>
                <ThreeText position={[-2, 0, 0]} fontSize={0.5} color="#94a3b8">L1 Input</ThreeText>
                {visualData[0]?.map((val: number, i: number) => (
                    <LinkedListNode
                        key={`l1-${i}`}
                        value={val}
                        position={[i * 3, 0, 0]}
                        nextPosition={i < visualData[0].length - 1 ? [(i + 1) * 3, 0, 0] : undefined}
                        isHighlighted={currentStep?.pointers?.l1 === i}
                        label={currentStep?.pointers?.l1 === i ? "L1" : undefined}
                    />
                ))}
            </group>
            {/* L2 Input */}
            <group position={[-6, 1, 0]}>
                <ThreeText position={[-2, 0, 0]} fontSize={0.5} color="#94a3b8">L2 Input</ThreeText>
                {visualData[1]?.map((val: number, i: number) => (
                    <LinkedListNode
                        key={`l2-${i}`}
                        value={val}
                        position={[i * 3, 0, 0]}
                        nextPosition={i < visualData[1].length - 1 ? [(i + 1) * 3, 0, 0] : undefined}
                        isHighlighted={currentStep?.pointers?.l2 === i}
                        label={currentStep?.pointers?.l2 === i ? "L2" : undefined}
                    />
                ))}
            </group>

            {/* RESULT - The Derived Animation */}
            <group position={[-6, -4, 0]}>
                <ThreeText position={[-2, 0, 0]} fontSize={0.5} color="#4ade80">Result</ThreeText>
                {derivedResultList.map((val: number, i: number) => (
                    <LinkedListNode
                        key={`res-${i}`}
                        value={val}
                        position={[i * 3, 0, 0]}
                        nextPosition={i < derivedResultList.length - 1 ? [(i + 1) * 3, 0, 0] : undefined}
                        isHighlighted={currentStep?.pointers?.tail === i}
                        label={currentStep?.pointers?.tail === i ? "Tail" : undefined}
                    />
                ))}
            </group>
        </>
    )
}
