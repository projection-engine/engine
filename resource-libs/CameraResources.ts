import {quat, vec3, vec4} from "gl-matrix";
import ArrayBufferAPI from "../lib/utils/ArrayBufferAPI";
import CameraEffects from "./CameraEffects";


const ORTHOGRAPHIC = 1, PERSPECTIVE = 0

function getNotificationBuffer(): Float32Array {
    const b = <Float32Array>ArrayBufferAPI.allocateVector(7, 0)
    b[0] = 1
    b[1] = 1
    b[2] = PERSPECTIVE
    b[3] = 0
    b[4] = .001
    b[5] = .1
    b[6] = 0
    return b
}

/**
 * @field notificationBuffers {float32array [viewNeedsUpdate, projectionNeedsUpdate, isOrthographic, hasChanged, translationSmoothing, rotationSmoothing, elapsed]}
 * @field transformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.worker]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */
export default class CameraResources extends CameraEffects {
    static position = ArrayBufferAPI.allocateVector(3)
    static viewMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static projectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static invViewMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static invProjectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static viewProjectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static previousViewProjectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static staticViewMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static skyboxProjectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static UBOBuffer = ArrayBufferAPI.allocateVector(84)
    static projectionBuffer = ArrayBufferAPI.allocateVector(5)
    static translationBuffer = <vec3>ArrayBufferAPI.allocateVector(3)
    static rotationBuffer = <quat>ArrayBufferAPI.allocateVector(4, 0, true)
    static notificationBuffers = getNotificationBuffer()

    static addTranslation(data: number[] | Float32Array) {
        const T = CameraResources.translationBuffer
        T[0] =  T[0] + data[0] || 0
        T[1] =  T[1] + data[1] || 0
        T[2] =  T[2] + data[2] || 0
    }

    static addRotation(data: number[] | Float32Array) {
        const R = CameraResources.rotationBuffer

        R[0] = R[0] + data[0] || 0
        R[1] = R[1] + data[1] || 0
        R[2] = R[2] + data[2] || 0
        R[3] = R[3] + data[3] || 0
    }

    static updateTranslation(data: number[] | Float32Array) {
        const T = CameraResources.translationBuffer
        T[0] = data[0] || 0
        T[1] = data[1] || 0
        T[2] = data[2] || 0
    }

    static updateRotation(data: number[] | Float32Array) {
        const R = CameraResources.rotationBuffer

        R[0] = data[0] || 0
        R[1] = data[1] || 0
        R[2] = data[2] || 0
        R[3] = data[3] || 0
    }

    static get didChange() {
        return CameraResources.notificationBuffers[3]
    }

    static get isOrthographic(): boolean {
        return CameraResources.notificationBuffers[2] === ORTHOGRAPHIC
    }

    static set isOrthographic(data) {
        CameraResources.notificationBuffers[2] = data ? ORTHOGRAPHIC : PERSPECTIVE
        CameraResources.notificationBuffers[1] = 1
    }

    static get zFar() {
        return CameraResources.projectionBuffer[0]
    }

    static get zNear() {
        return CameraResources.projectionBuffer[1]
    }

    static get fov() {
        return CameraResources.projectionBuffer[2]
    }

    static get aspectRatio() {
        return CameraResources.projectionBuffer[3]
    }

    static get orthographicProjectionSize() {
        return CameraResources.projectionBuffer[4]
    }

    static set zFar(data) {
        CameraResources.projectionBuffer[0] = data
    }

    static set zNear(data) {
        CameraResources.projectionBuffer[1] = data
    }

    static set fov(data) {
        CameraResources.projectionBuffer[2] = data
    }

    static set aspectRatio(data) {
        CameraResources.projectionBuffer[3] = data
    }

    static set orthographicProjectionSize(data) {
        CameraResources.projectionBuffer[4] = data
    }

    static set translationSmoothing(data) {
        CameraResources.notificationBuffers[4] = data
    }

    static get translationSmoothing() {
        return CameraResources.notificationBuffers[4]
    }

    static set rotationSmoothing(data) {
        CameraResources.notificationBuffers[5] = data
    }

    static get rotationSmoothing() {
        return CameraResources.notificationBuffers[5]
    }

    static updateProjection() {
        CameraResources.notificationBuffers[1] = 1
    }

    static updateView() {
        CameraResources.notificationBuffers[0] = 1
    }
}

