export default function getProbeRotation(index) {
    switch (index) {
        case 0:
            return {
                yaw: Math.PI / 2,
                pitch: 0,
            }
        case 1:
            return {
                yaw: -Math.PI / 2,
                pitch: 0,
            }
        case 2:
            return {
                yaw: Math.PI,
                pitch: -Math.PI / 2,
            }
        case 3:
            return {
                yaw: Math.PI,
                pitch: Math.PI / 2,
            }
        case 4:
            return {
                yaw: Math.PI,
                pitch: 0,
            }
        case 5:
            return {
                yaw: 0,
                pitch: 0,
            }
        default :
            return {
                yaw: 0,
                pitch: 0,
            }
    }

}



