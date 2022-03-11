import conf from "../../../assets/config.json";
import {linearAlgebraMath, Vector} from "pj-math";
import FreeCamera from "./FreeCamera";
import SphericalCamera from "./SphericalCamera";
import {mat3, mat4, quat, vec3, vec4} from "gl-matrix";

export default function perspectiveCameraEvents(camera, canvasID, onClick) {
    let target = document.getElementById(canvasID),
        cameraTarget = document.getElementById(canvasID.replace('-canvas', '') + '-camera-position')

    let isFocused = false
    let startMouseDown
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
                const forward = event.deltaY < 0
                const distance = (forward ? 1 : -1) * (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
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

                break
            }

            case 'mousemove': {
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
                            camera.pitch += (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)

                        // MIN ~-45deg
                        else if (event.movementY > 0 && camera.pitch > -maxAngle)
                            camera.pitch -= (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)
                    } else {
                        if (event.movementY < 0)
                            camera.pitch += (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)

                        // MIN ~-45deg
                        else if (event.movementY > 0)
                            camera.pitch -= (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)
                    }


                    if ((event.movementX < 0 && camera instanceof FreeCamera) || (event.movementX > 0 && camera instanceof SphericalCamera))
                        camera.yaw += (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.movementX)
                    else if ((event.movementX > 0 && camera instanceof FreeCamera) || (event.movementX < 0 && camera instanceof SphericalCamera))
                        camera.yaw -= (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.movementX)

                    camera.updateViewMatrix()
                    updateCamPosition()
                }
                break
            }
            case 'mousedown': {

                startMouseDown = performance.now()

                isFocused = true
                break
            }
            case 'mouseup': {
                requested = false
                isFocused = false
                document.exitPointerLock()


                break
            }
            case 'keyup':
            case 'keydown': {
                if (isFocused || event.type === 'keyup') {
                    if (camera instanceof FreeCamera) {
                        switch (event.code) {
                            case conf.keybindings.forwards: {
                                updateZ(true, event.type === 'keydown')
                                break
                            }
                            case conf.keybindings.backwards: {
                                updateZ(false, event.type === 'keydown')
                                break
                            }
                            case conf.keybindings.up: {
                                updateY(true, event.type === 'keydown')
                                break
                            }
                            case conf.keybindings.down: {
                                updateY(false, event.type === 'keydown')
                                break
                            }
                            case conf.keybindings.left: {
                                updateX(false, event.type === 'keydown')
                                break
                            }
                            case conf.keybindings.right: {
                                updateX(true, event.type === 'keydown')
                                break
                            }
                            default:
                                break
                        }
                    } else if (isFocused && (event.code === conf.keybindings.forwards || event.code === conf.keybindings.backwards)) {
                        const distance = (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)

                        let way = -1
                        if (event.code === conf.keybindings.backwards) {
                            way = 1
                        }
                        camera.radius += distance * way
                    }
                }
                break
            }
            default:
                break
        }

    }

    const handleClick = (event) => {
        let elapsedTime = performance.now() - startMouseDown;
        if (elapsedTime <= 250) {

            const target = document.getElementById(canvasID).getBoundingClientRect()
            onClick(event.clientX - target.left, event.clientY - target.top)
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