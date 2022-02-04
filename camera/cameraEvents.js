import conf from "../config.json";
import {linearAlgebraMath, Vector} from "pj-math";
import FreeCamera from "./FreeCamera";
import SphericalCamera from "./SphericalCamera";

export default function cameraEvents(camera, canvasID, onClick) {
    let target = document.getElementById(canvasID)
    let isFocused = false
    let startMouseDown
    const maxAngle = camera instanceof SphericalCamera ? 1.57 : .75

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
            case 'mousewheel': {
                const forward = event.deltaY < 0
                const distance = (forward ? 1 : -1) * (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
                if (camera instanceof FreeCamera) {
                    let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', camera.yaw), new Vector(0, 0, distance))
                    newPosition = newPosition.matrix

                    if (forward) {
                        camera.position[0] += newPosition[0]
                        camera.position[1] += newPosition[1]
                        camera.position[2] -= newPosition[2]
                    } else {
                        camera.position[0] += newPosition[0]
                        camera.position[1] += newPosition[1]
                        camera.position[2] -= newPosition[2]
                    }

                    camera.updateViewMatrix()
                } else {
                    camera.radius -= distance
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
                    }


                    // MAX ~45deg
                    if (event.movementY < 0 && camera.pitch < maxAngle)
                        camera.pitch += (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)

                    // MIN ~-45deg
                    else if (event.movementY > 0 && camera.pitch > -maxAngle)
                        camera.pitch -= (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.movementY)


                    if (event.movementX < 0)
                        camera.yaw += (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.movementX)
                    else if (event.movementX > 0)
                        camera.yaw -= (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.movementX)
                    if (camera instanceof FreeCamera)
                        camera.updateViewMatrix()

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
            default:
                break
        }

    }

    const handleKey = (event) => {


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
            } else if (event.code === conf.keybindings.forwards|| event.code===conf.keybindings.backwards) {
                const distance = (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)

                let way = -1
                if (event.code === conf.keybindings.backwards) {
                    way = 1
                }
                camera.radius += distance * way
            }

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

        document.addEventListener('keydown', handleKey)
        document.addEventListener('keyup', handleKey)


        target?.parentNode.addEventListener('click', handleClick)
        target?.addEventListener('mousedown', handleInput)
        document.addEventListener('mouseup', handleInput)
        document.addEventListener('mousemove', handleInput)
        target?.addEventListener('mousewheel', handleInput, {passive: true})
    }

    function stopTracking() {
        document.removeEventListener('keydown', handleKey)
        document.removeEventListener('keyup', handleKey)


        target?.parentNode?.removeEventListener('click', handleClick)
        target?.removeEventListener('mousedown', handleInput)
        document.removeEventListener('mouseup', handleInput)
        document.removeEventListener('mousemove', handleInput)
        target?.removeEventListener('mousewheel', handleInput, {passive: true})
    }

    return {
        startTracking,
        stopTracking
    }
}