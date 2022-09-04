import CameraAPI from "../../production/libs/CameraAPI";
import InputEventsAPI from "../../production/libs/InputEventsAPI";

import KEYS from "../../production/data/KEYS";
import {v4} from "uuid";
import {quat, vec3} from "gl-matrix";

let interval, ctrl, holding, isFocused, isDoubleClick
const BUTTON_MIDDLE = 1

export default class CameraTracker {
    static movementSpeed = 0.01
    static scrollSpeed = .5
    static scrollDelay = 100
    static turnSpeed = .01

    static increment = 0

    static yaw = 1.5
    static pitch = 0
    static centerOn = [0, 0, 0]
    static radius = 1
    static gizmoReference
    static cameraInitialized = false
    static animated = false


    static #incrementRadius(increment) {
        const cosPitch = Math.cos(CameraTracker.pitch)
        const position = []
        position[0] = increment * cosPitch * Math.cos(CameraTracker.yaw)
        position[1] = increment * Math.sin(CameraTracker.pitch)
        position[2] = increment * cosPitch * Math.sin(CameraTracker.yaw)

        vec3.add(CameraTracker.centerOn, CameraTracker.centerOn, position)
        CameraTracker.update(true)
    }

    static rotateY(angle, vec) {
        const matrix = new Array(4)
        for (let i = 0; i < 4; i++) {
            matrix[i] = new Array(4).fill(0)
        }
        matrix[0][0] = Math.cos(angle)
        matrix[0][2] = Math.sin(angle)
        matrix[2][0] = -Math.sin(angle)
        matrix[1][1] = 1
        matrix[2][2] = Math.cos(angle)
        matrix[3][3] = 1
        return [
            vec[0] * matrix[0][0] + vec[1] * matrix[1][0] + vec[2] * matrix[2][0],
            vec[0] * matrix[0][1] + vec[1] * matrix[1][1] + vec[2] * matrix[2][1],
            vec[0] * matrix[0][2] + vec[1] * matrix[1][2] + vec[2] * matrix[2][2]
        ]
    }

    static #handleInput(event) {
        switch (event.type) {
            case "wheel": {
                const forward = event.deltaY < 0
                const distance = (forward ? 1 : -1) * CameraTracker.scrollSpeed

                if (CameraTracker.animated) {
                    const s = Math.sign(CameraTracker.increment)
                    if (Math.sign(distance) !== s)
                        CameraTracker.increment = 0
                    CameraTracker.increment += distance
                    if (interval)
                        clearInterval(interval)
                    let percentage = Math.abs(CameraTracker.increment / CameraTracker.scrollDelay)

                    interval = setInterval(() => {
                        if (s < 0 && CameraTracker.increment <= 0 || s > 0 && CameraTracker.increment >= 0) {
                            const increment = -CameraTracker.increment * percentage
                            CameraTracker.#incrementRadius(increment)
                            if (s > 0)
                                CameraTracker.increment -= percentage
                            else
                                CameraTracker.increment += percentage
                        } else
                            clearInterval(interval)
                    }, 1)
                } else
                    CameraTracker.#incrementRadius(-distance)
                break
            }
            case "mousemove": {
                if (isFocused || isDoubleClick) {
                    if (!isDoubleClick) {
                        if (event.movementY < 0)
                            CameraTracker.pitch += CameraTracker.turnSpeed * Math.abs(event.movementY)

                        else if (event.movementY >= 0)
                            CameraTracker.pitch -= CameraTracker.turnSpeed * Math.abs(event.movementY)


                        if (event.movementX >= 0)
                            CameraTracker.yaw += CameraTracker.turnSpeed * Math.abs(event.movementX)
                        else if (event.movementX < 0)
                            CameraTracker.yaw -= CameraTracker.turnSpeed * Math.abs(event.movementX)

                    } else {
                        const newPosition = CameraTracker.rotateY(CameraTracker.yaw, [ctrl ? 0 : CameraTracker.movementSpeed * event.movementY, 0, -CameraTracker.movementSpeed * event.movementX])

                        CameraTracker.centerOn[0] += newPosition[0]
                        CameraTracker.centerOn[1] -= ctrl ? .1 * event.movementY : newPosition[1]
                        CameraTracker.centerOn[2] += newPosition[2]
                    }
                    CameraTracker.update(isDoubleClick)
                }
                break
            }
            case "mousedown":
                if (holding) {
                    document.body.requestPointerLock()
                    isDoubleClick = true
                }
                if (event.button === BUTTON_MIDDLE) {
                    isFocused = true
                } else
                    holding = true
                break
            case "mouseup":
                holding = false
                ctrl = false
                isFocused = false
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
        InputEventsAPI.listenTo(events.MOUSE_UP, CameraTracker.#handleInput)
        InputEventsAPI.listenTo(events.MOUSE_MOVE, CameraTracker.#handleInput)
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

    static transformCamera(event, type) {
        document.body.requestPointerLock()
        const handleMouseMove = (e) => {
            const incrementX = CameraTracker.movementSpeed * e.movementX,
                incrementY = CameraTracker.movementSpeed * e.movementY,
                c = [...CameraTracker.centerOn]

            if (type === 1) {
                const newPosition = CameraTracker.rotateY(CameraTracker.yaw, [incrementX, 0, 0])
                c[0] += newPosition[0]
                c[1] -= incrementY
                c[2] += newPosition[2]

                CameraTracker.centerOn = c
                CameraTracker.update()
            } else {
                CameraTracker.radius += CameraTracker.movementSpeed * e.movementX
                CameraTracker.update()
            }
        }

        const handleMouseUp = () => {
            document.exitPointerLock()
            document.removeEventListener("mousemove", handleMouseMove)
        }
        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp, {once: true})
    }
}