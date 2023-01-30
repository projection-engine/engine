import {quat, vec3} from "gl-matrix";
import ArrayBufferAPI from "../lib/utils/ArrayBufferAPI";
import CameraEffects from "./CameraEffects";
import CameraNotificationDecoder from "../lib/CameraNotificationDecoder";


/**
 * @field notificationBuffers {float32array [viewNeedsUpdate, projectionNeedsUpdate, isOrthographic, hasChanged, translationSmoothing,  elapsed]}
 * @field transformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
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
    static invSkyboxProjectionMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    static viewUBOBuffer = ArrayBufferAPI.allocateVector(52)
    static projectionUBOBuffer = ArrayBufferAPI.allocateVector(36)
    static projectionBuffer = ArrayBufferAPI.allocateVector(5)
    static translationBuffer = <vec3>ArrayBufferAPI.allocateVector(3)
    static rotationBuffer = <quat>ArrayBufferAPI.allocateVector(4, 0, true)
    static notificationBuffers = CameraNotificationDecoder.generateBuffer()


    static addTranslation(data: number[] | Float32Array) {
        const T = CameraResources.translationBuffer
        T[0] =  T[0] + data[0] || 0
        T[1] =  T[1] + data[1] || 0
        T[2] =  T[2] + data[2] || 0
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

}

