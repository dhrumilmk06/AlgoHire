import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

type QueueSphereProps = {
    value: number
}

export const QueueSphere = ({ value }: QueueSphereProps) => {
    // Low poly sphere (Icosahedron with detail 0) looks very retro
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), [])

    return (
        <group>
            {/* Dark Transparent Body */}
            <mesh geometry={geometry}>
                <meshStandardMaterial
                    color="#001133"
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Glowing Wireframe */}
            <lineSegments>
                <edgesGeometry args={[geometry]} />
                <lineBasicMaterial color="#00ffff" linewidth={2} />
            </lineSegments>

            {/* Value */}
            <Text
                position={[0, 0, 1.2]}
                fontSize={0.6}
                color="#FFD700"
                anchorX="center"
                anchorY="middle"
            >
                {value}
            </Text>
        </group>
    )
}
