import { useMemo } from 'react'
import * as THREE from 'three'

type ConnectionArrowProps = {
    start: [number, number, number]
    end: [number, number, number]
}

export const ConnectionArrow = ({ start, end }: ConnectionArrowProps) => {
    const { position, quaternion, length } = useMemo(() => {
        const startVec = new THREE.Vector3(...start)
        const endVec = new THREE.Vector3(...end)

        const direction = new THREE.Vector3().subVectors(endVec, startVec)
        const fullLength = direction.length()

        // Normalize direction for rotation calculation
        direction.normalize()

        // Create quaternion to rotate from default Up (Y-axis) to Direction
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)

        // Calculate shortened length and offset position
        // We want the arrow to start slightly away from the node center (radius ~1)
        const offset = 1.4
        const renderLength = Math.max(0.1, fullLength - (offset * 2))

        // The center of the arrow shaft should be exactly in the middle between the offset points
        const midPoint = new THREE.Vector3()
            .addVectors(startVec, endVec)
            .multiplyScalar(0.5)

        return {
            position: midPoint,
            quaternion,
            length: renderLength
        }
    }, [start, end])

    return (
        <group position={position} quaternion={quaternion}>
            {/* Shaft (Cylinder) */}
            <mesh position={[0, -0.2, 0]}>
                {/* Shift cylinder down slightly so cone sits on top perfectly? 
                    Actually standard cylinder is centered. 
                    If length is L, Top is L/2, Bottom is -L/2.
                    We want Cone to be at L/2.
                */}
                <cylinderGeometry args={[0.08, 0.08, length, 8]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.5}
                    transparent
                    opacity={0.8}
                />
            </mesh>

            {/* Head (Cone) */}
            <mesh position={[0, length / 2, 0]}>
                <coneGeometry args={[0.25, 0.6, 16]} />
                <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={0.8}
                />
            </mesh>
        </group>
    )
}
