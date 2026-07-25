import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import * as THREE from 'three'

type ArrayBoxProps = {
    position?: [number, number, number]
    index: number
    value: number | string
    isOpen?: boolean
    isHighlighted?: boolean
    address?: number
    showAddress?: boolean
    overrideColor?: string
    valuePlacement?: 'center' | 'top'
    label?: string
}

export const ArrayBox = ({ position = [0, 0, 0], index, value, isOpen, isHighlighted, address, showAddress, overrideColor, valuePlacement = 'center', label }: ArrayBoxProps) => {

    const { scale } = useSpring({
        scale: isOpen ? 1.1 : 1,
        config: { tension: 200, friction: 20 }
    })

    const boxGeometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), [])

    return (
        <animated.group position={position} scale={scale}>
            {/* The Dark Transparent Body */}
            <mesh geometry={boxGeometry}>
                <meshStandardMaterial
                    color={overrideColor || (isHighlighted ? "#00ffff" : "#001133")}
                    emissive={overrideColor || (isHighlighted ? "#00ffff" : "#000000")}
                    emissiveIntensity={isHighlighted ? 0.5 : 0}
                    transparent
                    opacity={isHighlighted ? 0.6 : 0.9}
                />
            </mesh>

            {/* The "Glowing" Wireframe Edge */}
            <lineSegments>
                <edgesGeometry args={[boxGeometry]} />
                <lineBasicMaterial color={isHighlighted ? "#ffffff" : "#00ffff"} linewidth={isHighlighted ? 4 : 2} />
            </lineSegments>

            {/* Pointer Label (New: L/R) */}
            {label && (
                <Text
                    position={[0, 2.5, 0]}
                    fontSize={1.0}
                    color="#f43f5e" // Rose-500
                    anchorX="center"
                    anchorY="bottom"
                    outlineWidth={0.05}
                    outlineColor="#000000"
                >
                    {label}
                </Text>
            )}

            {/* Index Label (Top) - Only show if value is NOT at top (avoid conflict) */}
            {valuePlacement !== 'top' && (
                <Text
                    position={[0, 1.5, 0]}
                    fontSize={0.6}
                    color="#FFD700"
                    anchorX="center"
                    anchorY="bottom"
                >
                    {index}
                </Text>
            )}

            {/* Value (Center or Top) */}
            <Text
                position={valuePlacement === 'top' ? [0, 1.5, 0] : [0, 0, 1.1]}
                fontSize={valuePlacement === 'top' ? 1 : 0.8} // Slightly larger for top visibility
                color={value === '1' ? "#ffffff" : (valuePlacement === 'top' ? "#94a3b8" : "#FFD700")} // Specific styling for grid: White '1', Dim '0'
                anchorX="center"
                anchorY="middle"
                renderOrder={1}
            >
                {value}
            </Text>

            {/* Address Label (Bottom) */}
            {showAddress && (
                <Text
                    position={[0, -1.8, 0]}
                    fontSize={0.35}
                    color="#4ade80" // Greenish cyan
                    anchorX="center"
                    anchorY="top"
                >
                    Addr: {address}
                </Text>
            )}
        </animated.group>
    )
}
