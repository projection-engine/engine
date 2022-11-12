import CameraAPI from "../../lib/utils/CameraAPI";
import {quat, vec3, vec4} from "gl-matrix";
import CAMERA_ROTATIONS from "../static/CAMERA_ROTATIONS";

let holding, toApplyTranslation
const toDeg = 180 / Math.PI, halfPI = Math.PI / 2
const MOUSE_RIGHT = 2, MOUSE_LEFT = 0
const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
export default class CameraTracker {
    static #isTracking = false
    static xRotation = 0
    static yRotation = 0

    static movementSpeed = 0.1
    static turnSpeed = .1

    static gizmoReference

    static toApplyTranslation = vec4.create()
    static currentTranslation = vec4.create()
    static #initialized = false
    static rotationChanged = false
    static forceUpdate = false
    static movementKeys = {
        forward: "KeyW",
        backward: "KeyS",
        left: "KeyA",
        right: "KeyD",
        invertDirection: false,
        fasterJonny: "ShiftLeft"

    }
    static #keysOnHold = {
        forward: false,
        backward: false,
        left: false,
        right: false,

        mouseLeft: false,
        mouseRight: false,
        fasterJonny: false
    }

    static initialize(settings) {
        if (CameraTracker.#initialized)
            return
        toApplyTranslation = CameraTracker.toApplyTranslation
        CameraTracker.#initialized = true

        if (settings.camera.serialization) {
            const x = settings.camera.xRotation
            const y = settings.camera.yRotation
            const translation = settings.camera.serialization.translation
            CameraTracker.xRotation = x || 0
            CameraTracker.yRotation = y || 0
            CameraTracker.rotationChanged = true

            CameraAPI.translationBuffer[0] = translation[0]
            CameraAPI.translationBuffer[1] = translation[1]
            CameraAPI.translationBuffer[2] = translation[2]

        }
        CameraTracker.forceUpdate = true
    }


    static updateFrame() {
        if (CameraAPI.didChange && CameraTracker.gizmoReference)
            CameraTracker.gizmoReference.style.transform = `translateZ(calc(var(--cube-size) * -3)) matrix3d(${CameraAPI.staticViewMatrix})`
        const map = CameraTracker.#keysOnHold
        let changed = CameraTracker.forceUpdate

        if (!changed) {
            toApplyTranslation[0] = 0
            toApplyTranslation[1] = 0
            toApplyTranslation[2] = 0
            toApplyTranslation[3] = 1
        }

        const multiplier = map.fasterJonny ? 10 * CameraTracker.movementSpeed : CameraTracker.movementSpeed
        if (map.left) {
            toApplyTranslation[0] -= multiplier
            changed = true
        }
        if (map.right) {
            toApplyTranslation[0] += multiplier
            changed = true
        }
        if (map.backward) {
            toApplyTranslation[2] += multiplier
            changed = true
        }
        if (map.forward) {
            toApplyTranslation[2] -= multiplier
            changed = true
        }

        if (CameraTracker.rotationChanged) {
            const pitch = quat.fromEuler([], CameraTracker.yRotation * toDeg, 0, 0)
            const yaw = quat.fromEuler([], 0, CameraTracker.xRotation * toDeg, 0)
            quat.copy(CameraAPI.rotationBuffer, pitch)
            CameraTracker.rotationChanged = false
            quat.multiply(CameraAPI.rotationBuffer, yaw, CameraAPI.rotationBuffer)
            changed = true
        }

        if (changed)
            CameraTracker.#transform()

    }

    static #transform() {
        CameraTracker.forceUpdate = false
        vec3.copy(CameraTracker.currentTranslation, CameraAPI.translationBuffer)
        vec4.transformQuat(toApplyTranslation, toApplyTranslation, CameraAPI.rotationBuffer)
        vec3.add(CameraAPI.translationBuffer, CameraAPI.translationBuffer, toApplyTranslation)
        CameraAPI.updateView()
    }

    static forceRotationTracking() {
        if (!holding) {
            document.body.requestPointerLock()
            document.addEventListener("mousemove", CameraTracker.#handleInput)
            holding = true
        }
        CameraTracker.#keysOnHold.mouseLeft = true
    }

    static #handleInput(event) {
        const keys = CameraTracker.movementKeys
        const map = CameraTracker.#keysOnHold
        try {
            switch (event.type) {
                case "mousemove": {
                    if (!document.pointerLockElement)
                        document.body.requestPointerLock()
                    if (map.mouseLeft && map.mouseRight || event.ctrlKey) {
                        const multiplier = map.fasterJonny ? 10 * CameraTracker.movementSpeed : CameraTracker.movementSpeed
                        toApplyTranslation[0] = -event.movementX * multiplier
                        toApplyTranslation[1] = event.movementY * multiplier
                        toApplyTranslation[2] = 0
                        toApplyTranslation[3] = 1
                        CameraTracker.forceUpdate = true
                    } else {
                        CameraTracker.rotationChanged = true
                        let multiplier = -1
                        if (CameraTracker.movementKeys.invertDirection)
                            multiplier = 1
                        CameraTracker.xRotation += multiplier * event.movementX * CameraTracker.turnSpeed
                        CameraTracker.yRotation += multiplier * event.movementY * CameraTracker.turnSpeed
                        CameraTracker.yRotation = clamp(CameraTracker.yRotation, -halfPI, halfPI)
                    }
                    break
                }
                case "mousedown":
                    if (event.button === MOUSE_LEFT)
                        map.mouseLeft = true
                    if (event.button === MOUSE_RIGHT)
                        map.mouseRight = true

                    if (!holding && map.mouseRight === true) {

                        document.addEventListener("mousemove", CameraTracker.#handleInput)
                        holding = true
                    }


                    break
                case "mouseup":
                    document.exitPointerLock()
                    if (event.button === MOUSE_LEFT)
                        map.mouseLeft = false
                    if (event.button === MOUSE_RIGHT)
                        map.mouseRight = false
                    if (!keys.mouseRight && !keys.mouseLeft) {
                        document.removeEventListener("mousemove", CameraTracker.#handleInput)
                        holding = false
                    }
                    break
                case "keyup":
                    switch (event.code) {
                        case keys.forward:
                            map.forward = false
                            break
                        case keys.backward:
                            map.backward = false
                            break
                        case keys.left:
                            map.left = false
                            break
                        case keys.right:
                            map.right = false
                            break
                        case keys.fasterJonny:
                            map.fasterJonny = false
                    }
                    break
                case "keydown":
                    if (!document.pointerLockElement)
                        return
                    switch (event.code) {
                        case keys.forward:
                            map.forward = true
                            break
                        case keys.backward:
                            map.backward = true
                            break
                        case keys.left:
                            map.left = true
                            break
                        case keys.right:
                            map.right = true
                            break
                        case keys.fasterJonny:
                            map.fasterJonny = true
                            break
                    }
                    break
                case "pointerlockchange":
                    if (!document.pointerLockElement) {
                        const map = CameraTracker.#keysOnHold
                        map.forward = false
                        map.backward = false
                        map.left = false
                        map.right = false
                        map.fasterJonny = false
                    }
                    break
                case "wheel":

                    event.preventDefault();
                    const multiplier = event.ctrlKey ? 10 * 2 : 2
                    toApplyTranslation[0] = toApplyTranslation[1] = 0
                    toApplyTranslation[3] = 1
                    toApplyTranslation[2] += multiplier * Math.sign(event.deltaY)
                    CameraTracker.#transform()
                    break
                default:
                    break
            }
        } catch (err) {
            console.warn(err)
        }
    }

    static startTracking() {
        if (CameraTracker.#isTracking)
            return
        CameraTracker.#isTracking = true
        document.addEventListener("pointerlockchange", CameraTracker.#handleInput)
        document.addEventListener("keydown", CameraTracker.#handleInput)
        document.addEventListener("keyup", CameraTracker.#handleInput)
        document.addEventListener("mouseup", CameraTracker.#handleInput)
        gpu.canvas.addEventListener("mousedown", CameraTracker.#handleInput)
        gpu.canvas.addEventListener("wheel", CameraTracker.#handleInput)

    }

    static stopTracking() {
        if (!CameraTracker.#isTracking)
            return
        CameraTracker.#isTracking = false
        document.removeEventListener("pointerlockchange", CameraTracker.#handleInput)
        document.removeEventListener("keydown", CameraTracker.#handleInput)
        document.removeEventListener("keyup", CameraTracker.#handleInput)
        document.removeEventListener("mouseup", CameraTracker.#handleInput)
        document.removeEventListener("mousemove", CameraTracker.#handleInput)
        gpu.canvas.removeEventListener("mousedown", CameraTracker.#handleInput)
        gpu.canvas.removeEventListener("wheel", CameraTracker.#handleInput)
    }


    static rotate(direction) {
        function updateCameraPlacement(yaw, pitch) {
            CameraAPI.updateProjection()
            CameraTracker.yRotation = pitch
            CameraTracker.xRotation = yaw
            CameraTracker.rotationChanged = true
        }

        vec4.copy(CameraAPI.rotationBuffer, [0, 0, 0, 1])

        switch (direction) {
            case CAMERA_ROTATIONS.TOP:
                updateCameraPlacement(0, -Math.PI / 2 - .001)
                break
            case CAMERA_ROTATIONS.BOTTOM:
                updateCameraPlacement(0, Math.PI / 2 - .001)
                break
            case CAMERA_ROTATIONS.BACK:
                updateCameraPlacement(Math.PI, 0)
                break
            case CAMERA_ROTATIONS.FRONT:
                updateCameraPlacement(0, 0)
                break
            case CAMERA_ROTATIONS.RIGHT:
                updateCameraPlacement(Math.PI / 2, 0)
                break
            case CAMERA_ROTATIONS.LEFT:
                updateCameraPlacement(Math.PI * 1.5, 0)
                break
        }
    }
}