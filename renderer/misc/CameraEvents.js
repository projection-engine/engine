import conf from "../../../../public/config.json";
import {linearAlgebraMath, Vector} from "pj-math";

export default function cameraEvents(camera) {
    let target = document.getElementById(camera.canvasID)
    let isFocused = false
    let lastMousePosition = {x: 0, y: 0}

    function handleInput(event) {
        const updateZ = (forward) => {
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
        }
        const updateX = (right) => {

            const x = (right ? -1 : 1) * (conf.sensitivity.right ? conf.sensitivity.right : 1)
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', camera.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            if (right) {
                camera.position[0] -= newPosition[0]
                camera.position[1] += newPosition[1]
                camera.position[2] += newPosition[2]
            } else {
                camera.position[0] -= newPosition[0]
                camera.position[1] += newPosition[1]
                camera.position[2] += newPosition[2]
            }

            camera.updateViewMatrix()
        }
        const updateY = (up) => {
            const y = (conf.sensitivity.up ? conf.sensitivity.up : 1)
            if (up) {
                camera.position[1] = camera.position[1] + y
            } else
                camera.position[1] = camera.position[1] - y

            camera.updateViewMatrix()
        }

        switch (event.type) {
            case 'mousewheel': {
                updateZ(event.deltaY < 0)
                break
            }
            case 'keydown': {

                if (isFocused) {
                    switch (event.code) {
                        case conf.keybindings.forwards: {
                            updateZ(true)
                            break
                        }
                        case conf.keybindings.backwards: {
                            updateZ(false)
                            break
                        }
                        case conf.keybindings.up: {
                            updateY(true)
                            break
                        }
                        case conf.keybindings.down: {
                            updateY(false)
                            break
                        }
                        case conf.keybindings.left: {
                            updateX(false)
                            break
                        }
                        case conf.keybindings.right: {
                            updateX(true)
                            break
                        }
                        default:
                            break
                    }
                }
                break
            }

            case 'mousemove': {
                if (isFocused) {

                    // 360
                    if (camera.yaw >= 6.28)
                        camera.yaw = 0
                    if (camera.yaw <= -6.28)
                        camera.yaw = 0

                    // MAX ~45deg
                    if (event.clientY - lastMousePosition.y < 0 && camera.pitch < .75)
                        camera.pitch += (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005)
                    // MIN ~-45deg
                    else if (event.clientY - lastMousePosition.y > 0 && camera.pitch > -.75)
                        camera.pitch -= (conf.sensitivity.pitch ? conf.sensitivity.pitch : .005)


                    if (event.clientX - lastMousePosition.x < 0)
                        camera.yaw += (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005)
                    else if (event.clientX - lastMousePosition.x > 0)
                        camera.yaw -= (conf.sensitivity.yaw ? conf.sensitivity.yaw : .005)

                    camera.updateViewMatrix()
                    lastMousePosition = {x: event.clientX, y: event.clientY}
                }
                break
            }
            case 'mousedown': {
                event.currentTarget.style.cursor = 'none'
                event.currentTarget.parentNode.style.outline = '#0095ff 1px solid'

                isFocused = true
                break
            }
            case 'mouseup': {
                const target = document.getElementById(camera.canvasID)
                isFocused = false
                target.style.cursor = 'default'
                target.parentNode.style.outline = 'var(--fabric-border-primary) 1px solid'
                lastMousePosition = {x: 0, y: 0}
                break
            }
            default:
                break
        }

    }

    function startTracking() {
        if (camera.type === 'free')
            document.addEventListener('keydown', handleInput)

        target?.addEventListener('mousedown', handleInput)
        document.addEventListener('mouseup', handleInput)
        document.addEventListener('mousemove', handleInput)
        target?.addEventListener('mousewheel', handleInput, {passive: true})
    }

    function stopTracking() {
        document.removeEventListener('keydown', handleInput)
        target?.removeEventListener('mousedown', handleInput)
        document.removeEventListener('mouseup', handleInput)
        document.removeEventListener('mousemove', handleInput)
        target?.removeEventListener('mousewheel', handleInput, {passive: true})
    }

    return{
        startTracking,
        stopTracking
    }
}