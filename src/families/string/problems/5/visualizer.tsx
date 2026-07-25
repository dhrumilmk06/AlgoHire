import type { PalindromeSnapshot } from './adapter';
import { Text } from '@react-three/drei';

interface VisualizerProps {
    snapshot: PalindromeSnapshot;
}

export const LongestPalindromeVisualizer = ({ snapshot }: VisualizerProps) => {
    const { chars, explanation, globalBestRange } = snapshot;
    const spacing = 1.2;
    const totalWidth = chars.length * spacing;
    const startX = -totalWidth / 2;

    const getColor = (status: string) => {
        switch (status) {
            case 'center': return '#fbbf24'; // amber-400
            case 'match': return '#4ade80'; // green-400
            case 'mismatch': return '#f87171'; // red-400
            case 'active': return '#60a5fa'; // blue-400
            case 'best-range': return '#c084fc'; // purple-400 (dimmed in logic usually)
            case 'current-range': return '#f472b6'; // pink-400
            default: return '#e2e8f0'; // slate-200
        }
    };

    // Helper to dim 'best-range' if not active
    const getOpacity = (status: string) => {
        if (status === 'default') return 0.5;
        if (status === 'best-range') return 0.8;
        return 1;
    }

    return (
        <group>
            {/* Title / Explanation (3D Text above) */}
            <Text
                position={[0, 3, 0]}
                fontSize={0.6}
                color="white"
                anchorX="center"
                anchorY="middle"
                maxWidth={10}
            >
                {explanation}
            </Text>

            {/* Input String */}
            <group position={[startX, 0, 0]}>
                {chars.map((char, index) => {
                    // Check if part of global best range for background highlight
                    const isGlobal = index >= globalBestRange[0] && index <= globalBestRange[1];

                    // Determine effective status override if needed
                    // (The snapshot chars status is source of truth, but we can overlay logic)
                    // Actually, the Adapter already sets 'current-range' status.
                    // So we might not need `isCurrent` if `char.status` handles it.

                    return (
                        <group key={index} position={[index * spacing, 0, 0]}>
                            {/* Detailed Box */}
                            <mesh position={[0, 0, 0]}>
                                <boxGeometry args={[1, 1, 0.5]} />
                                <meshStandardMaterial
                                    color={getColor(char.status)}
                                    opacity={getOpacity(char.status)}
                                    transparent
                                />
                            </mesh>

                            {/* Global Range Indicator (Underline or marker?) */}
                            {isGlobal && (
                                <mesh position={[0, -0.8, 0]}>
                                    <boxGeometry args={[1, 0.1, 0.1]} />
                                    <meshBasicMaterial color="#c084fc" />
                                </mesh>
                            )}

                            {/* Index */}
                            <Text position={[0, 1, 0]} fontSize={0.3} color="#94a3b8">
                                {index}
                            </Text>

                            {/* Character Value */}
                            <Text
                                position={[0, 0, 0.3]}
                                fontSize={0.6}
                                color="black"
                                anchorX="center"
                                anchorY="middle"
                            >
                                {char.val}
                            </Text>

                            {/* Pointers */}
                            {snapshot.leftPointer === index && (
                                <Text position={[0, -1.5, 0]} fontSize={0.4} color="#60a5fa">
                                    L
                                </Text>
                            )}
                            {snapshot.rightPointer === index && (
                                <Text position={[0, -1.5, 0]} fontSize={0.4} color="#60a5fa">
                                    R
                                </Text>
                            )}
                        </group>
                    );
                })}
            </group>

            {/* Legend / Stats */}
            <group position={[0, -4, 0]}>
                <Text position={[-3, 0, 0]} fontSize={0.4} color="#c084fc">
                    Global Best: [{globalBestRange[0]}, {globalBestRange[1]}]
                </Text>
                <Text position={[3, 0, 0]} fontSize={0.4} color="white">
                    Step Phase: {snapshot.centerType ? `${snapshot.centerType.toUpperCase()} Center` : 'Initializing'}
                </Text>
            </group>
        </group>
    );
};
