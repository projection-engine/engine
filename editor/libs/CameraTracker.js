import CameraAPI from "../../production/libs/apis/CameraAPI";
import ViewportEventsAPI from "../../production/libs/apis/ViewportEventsAPI";
import {rotateY} from "../../../../components/viewport/utils/transform-camera";
import KEYS from "../../production/data/KEYS";
import {v4} from "uuid";

let interval, ctrl, holding, isFocused, isDoubleClick, requested
const BUTTON_MIDDLE = 1

export default class CameraTracker {
    static cameraSpeed = 0.01
    static increment = 0
    static scrollSpeed = .5
    static cameraScrollDelay = 100

    static yaw = 1.5
    static pitch = 1.5
    static centerOn = [0, 0, 0]
    static radius = 10
    static gizmoReference
    static cameraInitialized = false
    static animated = false

    static #handleInput(event) {
        switch (event.type) {
            case "wheel": {
                const forward = event.deltaY < 0
                const distance = (forward ? 1 : -1) * CameraTracker.scrollSpeed * (CameraTracker.animated ? 1 : 3)

                if (CameraTracker.animated) {
                    const s = Math.sign(CameraTracker.increment)
                    if (Math.sign(distance) !== s)
                        CameraTracker.increment = 0
                    CameraTracker.increment += distance
                    if (interval)
                        clearInterval(interval)
                    let percentage = Math.abs(CameraTracker.increment / CameraTracker.cameraScrollDelay)

                    interval = setInterval(() => {
                        if (s < 0 && CameraTracker.increment <= 0 || s > 0 && CameraTracker.increment >= 0) {
                            CameraTracker.radius -= CameraTracker.increment * percentage
                            CameraTracker.update(true)
                            if (s > 0)
                                CameraTracker.increment -= percentage
                            else
                                CameraTracker.increment += percentage
                        } else
                            clearInterval(interval)
                    }, 1)
                } else {
                    CameraTracker.radius -= distance
                    CameraTracker.update(true)
                }
                break
            }
            case "mousemove": {
                if (isFocused || isDoubleClick) {
                    if (!requested) {
                        requested = true
                        window.gpu.canvas.requestPointerLock()
                    }
                    if (!isDoubleClick) {
                        if (event.movementY < 0)
                            CameraTracker.pitch += .01 * Math.abs(event.movementY)

                        else if (event.movementY > 0)
                            CameraTracker.pitch -= .01 * Math.abs(event.movementY)

                        if (event.movementX > 0)
                            CameraTracker.yaw += .01 * Math.abs(event.movementX)
                        else if (event.movementX < 0)
                            CameraTracker.yaw -= .01 * Math.abs(event.movementX)

                    } else {
                        const newPosition = rotateY(CameraTracker.yaw, [ctrl ? 0 : CameraTracker.cameraSpeed * event.movementY, 0, -CameraTracker.cameraSpeed * event.movementX])

                        CameraTracker.centerOn[0] += newPosition[0]
                        CameraTracker.centerOn[1] -= ctrl ? .1 * event.movementY : newPosition[1]
                        CameraTracker.centerOn[2] += newPosition[2]
                    }
                    CameraTracker.update(isDoubleClick)
                }
                break
            }
            case "mousedown":
                if (holding)
                    isDoubleClick = true
                if (event.button === BUTTON_MIDDLE) {
                    isFocused = true
                } else
                    holding = true
                break
            case "mouseup":
                holding = false
                ctrl = false
                requested = false
                isFocused = false
                document.exitPointerLock()
                isDoubleClick = false
                break
            case "keyup":
            case "keydown":
                if (event.code === KEYS.ControlLeft || event.code === KEYS.ControlRight)
                    ctrl = event.type === "keydown"
                break
            default:
                break
        }
    }

    static #id = v4()

    static startTracking() {
        document.addEventListener("keydown", CameraTracker.#handleInput)
        document.addEventListener("keyup", CameraTracker.#handleInput)
        document.addEventListener("mouseup", CameraTracker.#handleInput)
        document.addEventListener("mousemove", CameraTracker.#handleInput)

        ViewportEventsAPI.addEvent("mousedown", CameraTracker.#handleInput, undefined, CameraTracker.#id)
        ViewportEventsAPI.addEvent("wheel", CameraTracker.#handleInput, {passive: true}, CameraTracker.#id)
    }

    static stopTracking() {
        document.removeEventListener("keydown", CameraTracker.#handleInput)
        document.removeEventListener("keyup", CameraTracker.#handleInput)
        document.removeEventListener("mouseup", CameraTracker.#handleInput)
        document.removeEventListener("mousemove", CameraTracker.#handleInput)

        ViewportEventsAPI.removeEvent("mousedown", CameraTracker.#id)
        ViewportEventsAPI.removeEvent("wheel", CameraTracker.#id)
    }

    static update(onlyRadiusUpdate) {
        if (CameraTracker.gizmoReference && !onlyRadiusUpdate) {
            const transformationMatrix = CameraAPI.staticViewMatrix
            CameraTracker.gizmoReference.style.transform = `translateZ(calc(var(--cube-size) * -3)) matrix3d(${transformationMatrix})`
        }
        CameraAPI.metadata.size = CameraTracker.radius
        CameraAPI.sphericalTransformation([CameraTracker.yaw, CameraTracker.pitch], CameraTracker.radius, CameraTracker.centerOn)
    }
}