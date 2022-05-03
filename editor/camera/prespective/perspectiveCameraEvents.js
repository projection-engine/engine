import {linearAlgebraMath, Vector} from "pj-math";
import FreeCamera from "./FreeCamera";
import SphericalCamera from "./SphericalCamera";
import {KEYS} from "../../../../pages/project/hooks/useHotKeys";

export default function perspectiveCameraEvents(camera, canvasID, onClick) {
    let target = document.getElementById(canvasID),
        cameraTarget = document.getElementById(canvasID.replace('-canvas', '') + '-camera-position')

    let isFocused = false
    let positionChanged = false
    const maxAngle = 1.5

    const updateCamPosition = () => {
        cameraTarget.innerHTML = `
                    <div><b>X:</b> ${camera.position[0].toFixed(2)}</div>
                    <div><b>Y:</b>  ${camera.position[1].toFixed(2)}</div>
                    <div><b>Z:</b>  ${camera.position[2].toFixed(2)}</div>
                    `
    }

    if (camera instanceof FreeCamera)
        camera.onMove = updateCamPosition
    updateCamPosition()
    const updateZ = (forward, active) => {

        if (forward)
            camera.direction.forward = active
        else
            camera.direction.backward = active
    }
    const updateX = (right, active) => {
        if (right)
            camera.direction.right = active
        else
            camera.direction.left = active
    }
    const updateY = (up, active) => {
        if (up)
            camera.direction.up = active
        else
            camera.direction.down = active
    }
    let requested = false

    function handleInput(event) {
        switch (event.type) {
            case 'wheel': {
                if(!camera.notChangableRadius) {
                    const forward = event.deltaY < 0
                    const distance = (forward ? 1 : -1) * .5
                    if (camera instanceof FreeCamera) {
                        let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', camera.yaw), new Vector(0, 0, distance))
                        newPosition = newPosition.matrix

                        if (forward) {
                            camera.position[0] += newPosition[0]
                            camera.position[1] += Math.sin(camera.pitch)
                            camera.position[2] -= newPosition[2]
                        } else {
                            camera.position[0] += newPosition[0]
                            camera.position[1] -= Math.sin(camera.pitch)
                            camera.position[2] -= newPosition[2]
                        }

                        camera.updateViewMatrix()
                        updateCamPosition()
                    } else {
                        camera.radius -= distance
                        updateCamPosition()
                    }
                }
                break
            }

            case 'mousemove': {
                positionChanged = true
                if (isFocused) {
                    if (!requested) {
                        requested = true
                        target.requestPointerLock()
                    }
                    // 360
                    if (camera instanceof FreeCamera) {
                        if (camera.yaw >= 6.28)
                            camera.yaw = 0
                        if (camera.yaw <= -6.28)
                            camera.yaw = 0
                        // MAX ~45deg
                        if (event.movementY < 0 && camera.pitch < maxAngle)
                            camera.pitch += .01 * Math.abs(event.movementY)

                        // MIN ~-45deg
                        else if (event.movementY > 0 && camera.pitch > -maxAngle)
                            camera.pitch -= .01 * Math.abs(event.movementY)
                    } else {
                        if (event.movementY < 0)
                            camera.pitch += .01 * Math.abs(event.movementY)

                        // MIN ~-45deg
                        else if (event.movementY > 0)
                            camera.pitch -= .01 * Math.abs(event.movementY)
                    }


                    if ((event.movementX < 0 && camera instanceof FreeCamera) || (event.movementX > 0 && camera instanceof SphericalCamera))
                        camera.yaw += .01 * Math.abs(event.movementX)
                    else if ((event.movementX > 0 && camera instanceof FreeCamera) || (event.movementX < 0 && camera instanceof SphericalCamera))
                        camera.yaw -= .01 * Math.abs(event.movementX)

                    camera.updateViewMatrix()
                    updateCamPosition()
                }
                break
            }
            case 'mousedown': {
                isFocused = true
                break
            }
            case 'mouseup': {
                requested = false
                isFocused = false
                positionChanged = false
                document.exitPointerLock()


                break
            }
            case 'keyup':
            case 'keydown': {
                if(!camera.notChangableRadius) {
                    if (isFocused || event.type === 'keyup') {
                        if (camera instanceof FreeCamera) {
                            switch (event.code) {
                                case KEYS.KeyW : {
                                    updateZ(true, event.type === 'keydown')
                                    break
                                }
                                case KEYS.KeyS: {
                                    updateZ(false, event.type === 'keydown')
                                    break
                                }
                                case KEYS.ArrowUp: {
                                    updateY(true, event.type === 'keydown')
                                    break
                                }
                                case KEYS.ArrowDown: {
                                    updateY(false, event.type === 'keydown')
                                    break
                                }
                                case KEYS.KeyA: {
                                    updateX(false, event.type === 'keydown')
                                    break
                                }
                                case KEYS.KeyD: {
                                    updateX(true, event.type === 'keydown')
                                    break
                                }
                                default:
                                    break
                            }
                        } else if (isFocused && (event.code === KEYS.KeyW || event.code === KEYS.KeyS)) {
                            const distance = .5

                            let way = -1
                            if (event.code === KEYS.KeyS) {
                                way = 1
                            }
                            camera.radius += distance * way
                        }
                    }
                }
                break
            }
            default:
                break
        }

    }

    const handleClick = (event) => {

        if (!positionChanged) {
            const target = document.getElementById(canvasID).getBoundingClientRect()
            onClick(event.clientX - target.left, event.clientY - target.top, event.ctrlKey)
        }
    }

    function startTracking() {

        document.addEventListener('keydown', handleInput)
        document.addEventListener('keyup', handleInput)


        target?.parentNode.addEventListener('click', handleClick)
        target?.addEventListener('mousedown', handleInput)
        document.addEventListener('mouseup', handleInput)
        document.addEventListener('mousemove', handleInput)
        target?.addEventListener('wheel', handleInput, {passive: true})
    }

    function stopTracking() {
        document.removeEventListener('keydown', handleInput)
        document.removeEventListener('keyup', handleInput)


        target?.parentNode?.removeEventListener('click', handleClick)
        target?.removeEventListener('mousedown', handleInput)
        document.removeEventListener('mouseup', handleInput)
        document.removeEventListener('mousemove', handleInput)
        target?.removeEventListener('wheel', handleInput)
    }

    return {
        startTracking,
        stopTracking
    }
}