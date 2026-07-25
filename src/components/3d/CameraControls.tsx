import { CameraControls as CameraControlsDrei } from '@react-three/drei'
import { forwardRef, type ComponentProps } from 'react'

type CameraControlsProps = ComponentProps<typeof CameraControlsDrei>

const CameraControls = forwardRef<CameraControlsDrei, CameraControlsProps>((props, ref) => {
    return (
        <CameraControlsDrei
            ref={ref}
            makeDefault
            minDistance={5}
            maxDistance={40}
            dollySpeed={1.5}
            azimuthRotateSpeed={1.5}
            polarRotateSpeed={1.5}
            truckSpeed={2.5}
            smoothTime={0.25}
            {...props}
        />
    )
})

CameraControls.displayName = 'CameraControls'

export default CameraControls
