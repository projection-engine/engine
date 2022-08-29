import CameraAPI from "../../production/libs/apis/CameraAPI";
import InputEventsAPI from "../../production/libs/apis/InputEventsAPI";
import {rotateY} from "../../../../components/viewport/utils/transform-camera";
import KEYS from "../../production/data/KEYS";
import {v4} from "uuid";

let interval, ctrl, holding, isFocused, isDoubleClick
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
                    InputEventsAPI.lockPointer()
                    if (!isDoubleClick) {
                        if (event.movementY < 0)
                            CameraTracker.pitch += .01 * Math.abs(event.movementY)

                        else if (event.movementY >= 0)
                            CameraTracker.pitch -= .01 * Math.abs(event.movementY)

                        if (event.movementX >= 0)
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
        const events = InputEventsAPI.EVENTS
        InputEventsAPI.listenTo(events.KEY_DOWN, CameraTracker.#handleInput, CameraTracker.#id)
        InputEventsAPI.listenTo(events.KEY_UP, CameraTracker.#handleInput, CameraTracker.#id)
        InputEventsAPI.listenTo(events.MOUSE_UP, CameraTracker.#handleInput, CameraTracker.#id)
        InputEventsAPI.listenTo(events.MOUSE_MOVE, CameraTracker.#handleInput, CameraTracker.#id)
        InputEventsAPI.listenTo(events.MOUSE_DOWN, CameraTracker.#handleInput, CameraTracker.#id)
        InputEventsAPI.listenTo(events.WHEEL, CameraTracker.#handleInput, CameraTracker.#id)
    }

    static stopTracking() {
        const events = InputEventsAPI.EVENTS
        InputEventsAPI.removeEvent(events.KEY_DOWN, CameraTracker.#id)
        InputEventsAPI.removeEvent(events.KEY_UP, CameraTracker.#id)
        InputEventsAPI.removeEvent(events.MOUSE_UP, CameraTracker.#id)
        InputEventsAPI.removeEvent(events.MOUSE_MOVE, CameraTracker.#id)
        InputEventsAPI.removeEvent(events.MOUSE_DOWN, CameraTracker.#id)
        InputEventsAPI.removeEvent(events.WHEEL, CameraTracker.#id)
    }

    static update(onlyRadiusUpdate) {
        CameraAPI.metadata.size = CameraTracker.radius
        CameraAPI.sphericalTransformation([CameraTracker.yaw, CameraTracker.pitch], CameraTracker.radius, CameraTracker.centerOn)

        if (CameraTracker.gizmoReference && !onlyRadiusUpdate) {
            const transformationMatrix = CameraAPI.staticViewMatrix
            CameraTracker.gizmoReference.style.transform = `translateZ(calc(var(--cube-size) * -3)) matrix3d(${transformationMatrix})`
        }
    }
}