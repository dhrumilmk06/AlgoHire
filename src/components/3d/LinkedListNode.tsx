import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type LinkedListNodeProps = {
    value: number
    position?: [number, number, number]
    nextPosition?: [number, number, number]
    label?: string
    isHighlighted?: boolean
}

export const LinkedListNode = ({ value, position = [0, 0, 0], nextPosition, label, isHighlighted }: LinkedListNodeProps) => {
    // Use BoxGeometry (2x2x2)
    const geometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])

    // Calculate Arrow
    const arrowData = useMemo(() => {
        if (!nextPosition) return null
        const start = new THREE.Vector3(...position)
        const end = new THREE.Vector3(...nextPosition)

        const direction = new THREE.Vector3().subVectors(end, start)
        const length = direction.length()
        const dirNormalized = direction.clone().normalize()

        // Arrow starts at edge of box (roughly 1 unit out) and ends before next box
        const arrowStart = start.clone().add(dirNormalized.clone().multiplyScalar(1))
        const arrowLength = length - 2 // Gap between boxes

        return { origin: arrowStart, dir: dirNormalized, len: arrowLength }
    }, [position, nextPosition])

    return (
        <group>
            <group position={position}>
                {/* Body */}
                <mesh geometry={geometry}>
                    <meshStandardMaterial
                        color={isHighlighted ? '#f59e0b' : '#001133'} // Orange if highlighted
                        transparent
                        opacity={0.9}
                    />
                </mesh>

                {/* Wireframe */}
                <lineSegments>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color={isHighlighted ? '#fbbf24' : '#00ffff'} linewidth={2} />
                </lineSegments>

                {/* Value */}
                <Text
                    position={[0, 0, 1.1]}
                    fontSize={0.8}
                    color={isHighlighted ? '#FFF' : '#FFD700'}
                    anchorX="center"
                    anchorY="middle"
                >
                    {value}
                </Text>

                {/* Label (Pointer) */}
                {label && (
                    <Text
                        position={[0, 1.5, 0]}
                        fontSize={0.5}
                        color="#ffffff"
                        anchorX="center"
                        anchorY="bottom"
                    >
                        {label}
                    </Text>
                )}
            </group>

            {/* Arrow to next node */}
            {arrowData && arrowData.len > 0 && (
                <arrowHelper
                    args={[arrowData.dir, arrowData.origin, arrowData.len, 0x00ffff, 0.5, 0.3]}
                />
            )}
        </group>
    )
}
