import conf from "../../../config.json";
import {linearAlgebraMath, Vector} from "pj-math";

export default function cameraEvents(camera, onClick) {
    let target = document.getElementById(camera.canvasID)
    let isFocused = false
    let lastMousePosition = {x: 0, y: 0}
    let startMouseDown

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

    function handleInput(event) {
        switch (event.type) {
            case 'mousewheel': {
                const forward = event.deltaY < 0
                const z = (forward ? 1 : -1) * (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
                let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', camera.yaw), new Vector(0, 0, z))
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

                break
            }

            case 'mousemove': {
                if (isFocused) {
                    if (!lastMousePosition.x)
                        lastMousePosition.x = event.clientX

                    if (!lastMousePosition.y)
                        lastMousePosition.y = event.clientY

                    // 360
                    if (camera.yaw >= 6.28)
                        camera.yaw = 0
                    if (camera.yaw <= -6.28)
                        camera.yaw = 0

                    // MAX ~45deg
                    if (event.clientY - lastMousePosition.y < 0 && camera.pitch < .75)
                        camera.pitch += (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.clientY - lastMousePosition.y)
                    // MIN ~-45deg
                    else if (event.clientY - lastMousePosition.y > 0 && camera.pitch > -.75)
                        camera.pitch -= (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005) * Math.abs(event.clientY - lastMousePosition.y)


                    if (event.clientX - lastMousePosition.x < 0)
                        camera.yaw += (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.clientX - lastMousePosition.x)
                    else if (event.clientX - lastMousePosition.x > 0)
                        camera.yaw -= (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005) * Math.abs(event.clientX - lastMousePosition.x)

                    camera.updateViewMatrix()
                    lastMousePosition = {x: event.clientX, y: event.clientY}
                }
                break
            }
            case 'mousedown': {
                startMouseDown = performance.now()

                event.currentTarget.style.cursor = 'none'
                event.currentTarget.parentNode.style.outline = '#0095ff 1px solid'

                isFocused = true
                break
            }
            case 'mouseup': {

                const target = document.getElementById(camera.canvasID)
                if (target !== null) {
                    target.style.cursor = 'default'
                    target.parentNode.style.outline = 'var(--fabric-border-primary) 1px solid'
                }
                isFocused = false

                lastMousePosition = {x: undefined, y: undefined}
                break
            }
            default:
                break
        }

    }

    const handleKey = (event) => {
        if (isFocused || event.type === 'keyup') {
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
        }
    }
    const handleClick = (event) => {
        let elapsedTime = performance.now() - startMouseDown;
        if (elapsedTime <= 250) {

            const target = document.getElementById(camera.canvasID).getBoundingClientRect()
            onClick(event.clientX - target.left , event.clientY - target.top)
        }
    }

    function startTracking() {
        if (camera.type === 'free') {
            document.addEventListener('keydown', handleKey)
            document.addEventListener('keyup', handleKey)
        }

        target?.parentNode.addEventListener('click', handleClick)
        target?.addEventListener('mousedown', handleInput)
        document.addEventListener('mouseup', handleInput)
        document.addEventListener('mousemove', handleInput)
        target?.addEventListener('mousewheel', handleInput, {passive: true})
    }

    function stopTracking() {
        if (camera.type === 'free') {
            document.removeEventListener('keydown', handleKey)
            document.removeEventListener('keyup', handleKey)
        }

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