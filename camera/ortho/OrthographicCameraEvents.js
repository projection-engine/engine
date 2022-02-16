import conf from "../../config.json";
import {DIRECTIONS} from "./OrthographicCamera";

export default function OrthographicCameraEvents(camera, canvasID, onClick) {
    let target = document.getElementById(canvasID),
        cameraTarget = document.getElementById(canvasID.replace('-canvas', '') + '-camera-position')
    let isFocused = false
    let startMouseDown
    let lastPosition = {x: 0, y: 0}

    cameraTarget.innerHTML = `
                    <div><b>X:</b> ${camera.position[0].toFixed(2)}</div>
                    <div><b>Y:</b>  ${camera.position[1].toFixed(2)}</div>
                    <div><b>Z:</b>  ${camera.position[2].toFixed(2)}</div>
                    `

    function handleInput(event) {
        switch (event.type) {
            case 'wheel': {
                const forward = event.deltaY < 0
                if (camera.size > 0 || forward)
                    camera.size += (forward ? 1 : -1) * (conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
                break
            }
            case 'mousemove': {

                if (isFocused) {
                    if (camera.direction === DIRECTIONS.BOTTOM || camera.direction === DIRECTIONS.TOP) {
                        camera.position[2] -= (event.clientY - lastPosition.y) * 6 / (camera.size + 1)
                        camera.position[0] -= (event.clientX - lastPosition.x) * 6 / (camera.size + 1)
                    } else if (camera.direction === DIRECTIONS.LEFT || camera.direction === DIRECTIONS.RIGHT){
                        camera.position[2] -= (camera.direction === DIRECTIONS.RIGHT ? -1 : 1) * (event.clientX - lastPosition.x) * 6 / (camera.size + 1)
                        camera.position[1] += (event.clientY - lastPosition.y) * 6 / (camera.size + 1)
                    }
                    else {
                        camera.position[0] -= (camera.direction === DIRECTIONS.BACK ? -1 : 1) * (event.clientX - lastPosition.x) * 6 / (camera.size + 1)
                        camera.position[1] +=  (event.clientY - lastPosition.y) * 6 / (camera.size + 1)
                    }
                    cameraTarget.innerHTML = `
                    <div><b>X:</b> ${camera.position[0].toFixed(2)}</div>
                    <div><b>Y:</b> ${camera.position[1].toFixed(2)}</div>
                    <div><b>Z:</b> ${camera.position[2].toFixed(2)}</div>
                    `
                    camera.updateViewMatrix()
                    lastPosition = {x: event.clientX, y: event.clientY}
                }
                break
            }
            case 'mousedown': {

                if (event.button === 2) {
                    lastPosition = {x: event.clientX, y: event.clientY}
                    startMouseDown = performance.now()
                    isFocused = true

                    target.style.cursor = 'grabbing'
                }
                break
            }
            case 'mouseup': {
                lastPosition = {x: 0, y: 0}
                isFocused = false
                target.style.cursor = 'default'

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

        target?.parentNode.addEventListener('click', handleClick)
        target?.addEventListener('mousedown', handleInput)
        document.addEventListener('mouseup', handleInput)
        document.addEventListener('mousemove', handleInput)
        target?.addEventListener('wheel', handleInput, {passive: true})
    }

    function stopTracking() {
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