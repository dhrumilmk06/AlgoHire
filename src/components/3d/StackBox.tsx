import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type StackBoxProps = {
    value: number
}

export const StackBox = ({ value }: StackBoxProps) => {
    const boxGeometry = useMemo(() => new THREE.BoxGeometry(3, 1, 3), [])

    return (
        <group>
            {/* Dark Transparent Body */}
            <mesh geometry={boxGeometry}>
                <meshStandardMaterial
                    color="#001133"
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Glowing Wireframe */}
            <lineSegments>
                <edgesGeometry args={[boxGeometry]} />
                <lineBasicMaterial color="#00ffff" linewidth={2} />
            </lineSegments>

            {/* Value Label */}
            <Text
                position={[0, 0, 1.6]}
                fontSize={0.5}
                color="#FFD700"
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
        </group>
    )
}
