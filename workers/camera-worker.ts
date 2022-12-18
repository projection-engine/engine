import {mat4, quat, vec3} from "gl-matrix";
import TransformationAPI from "../lib/math/TransformationAPI";
import copyWithOffset from "../utils/copy-with-offset";


/**
 * @field notificationBuffers {float32array [viewNeedsUpdate, projectionNeedsUpdate, isOrthographic, hasChanged, translationSmoothing, rotationSmoothing]}
 * @field transformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */


const ORTHOGRAPHIC = 1
let needsUpdate = false, then = 0, elapsed = 0
let nBuffer

class CameraWorker {
    static #translationBuffer
    static #rotationBuffer
    static isOrtho = false
    static #notificationBuffers
    static #position
    static #viewMatrix
    static #projectionMatrix
    static #invViewMatrix
    static #invProjectionMatrix
    static viewProjectionMatrix
    static #staticViewMatrix
    static initialized = false
    static #projectionBuffer
    static #skyboxProjectionMatrix

    static currentTranslation = TransformationAPI.vec3.create()
    static currentRotation = TransformationAPI.quat.create()
    static UBOBuffer

    static initialize(data:Float32Array[]) {
        const [
            notificationBuffers,
            position,
            viewMatrix,
            projectionMatrix,
            invViewMatrix,
            invProjectionMatrix,
            staticViewMatrix,
            translationBuffer,
            rotationBuffer,
            skyboxProjectionMatrix,
            projectionBuffer,
            viewProjectionMatrix,
            UBOBuffer
        ] = data
        if (CameraWorker.initialized)
            return

        CameraWorker.viewProjectionMatrix = viewProjectionMatrix
        CameraWorker.#projectionBuffer = projectionBuffer
        CameraWorker.initialized = true
        nBuffer = CameraWorker.#notificationBuffers = notificationBuffers
        CameraWorker.#position = position
        CameraWorker.#viewMatrix = viewMatrix
        CameraWorker.#projectionMatrix = projectionMatrix
        CameraWorker.#invViewMatrix = invViewMatrix
        CameraWorker.#invProjectionMatrix = invProjectionMatrix
        CameraWorker.#staticViewMatrix = staticViewMatrix
        CameraWorker.#translationBuffer = translationBuffer
        CameraWorker.#rotationBuffer = rotationBuffer
        CameraWorker.#skyboxProjectionMatrix = skyboxProjectionMatrix
        TransformationAPI.vec3.copy(CameraWorker.currentTranslation, CameraWorker.#translationBuffer)
        TransformationAPI.quat.copy(CameraWorker.currentRotation, CameraWorker.#rotationBuffer)
        CameraWorker.UBOBuffer = UBOBuffer

        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.#projectionMatrix, CameraWorker.#viewMatrix)
    }

    static #updateProjection() {
        const isOrthographic = nBuffer[2] === ORTHOGRAPHIC

        const buffer = CameraWorker.#projectionBuffer


        const aR = buffer[3]
        const fov = buffer[2]
        const zFar = buffer[0]
        const zNear = buffer[1]

        CameraWorker.isOrtho = isOrthographic
        if (isOrthographic) {
            const distanceFromCamera = vec3.length(CameraWorker.#position)
            mat4.ortho(CameraWorker.#projectionMatrix, -distanceFromCamera, distanceFromCamera, -distanceFromCamera / aR, distanceFromCamera / aR, zNear, zFar)
        } else {
            mat4.perspective(CameraWorker.#projectionMatrix, fov, aR, zNear, zFar)
            mat4.perspective(CameraWorker.#skyboxProjectionMatrix, fov, aR, .1, 1000)
        }

        mat4.invert(CameraWorker.#invProjectionMatrix, CameraWorker.#projectionMatrix)
        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.#projectionMatrix, CameraWorker.#viewMatrix)
        CameraWorker.updateUBO()
    }

    static #updateStaticViewMatrix() {
        const matrix = mat4.copy(CameraWorker.#staticViewMatrix, CameraWorker.#viewMatrix)
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }


    static #updateView() {
        mat4.fromRotationTranslation(CameraWorker.#invViewMatrix, CameraWorker.currentRotation, CameraWorker.currentTranslation)
        mat4.invert(CameraWorker.#viewMatrix, CameraWorker.#invViewMatrix)
        const m = CameraWorker.#invViewMatrix
        CameraWorker.#position[0] = m[12]
        CameraWorker.#position[1] = m[13]
        CameraWorker.#position[2] = m[14]

        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.#projectionMatrix, CameraWorker.#viewMatrix)
        CameraWorker.updateUBO()
        CameraWorker.#updateStaticViewMatrix()
    }

    static updateUBO() {
        const cacheUBOBuffer = CameraWorker.UBOBuffer
        copyWithOffset(cacheUBOBuffer, CameraWorker.viewProjectionMatrix, 0)
        copyWithOffset(cacheUBOBuffer, CameraWorker.#viewMatrix, 16)
        copyWithOffset(cacheUBOBuffer, CameraWorker.#projectionMatrix, 32)
        copyWithOffset(cacheUBOBuffer, CameraWorker.#invViewMatrix, 48)
        copyWithOffset(cacheUBOBuffer, CameraWorker.#invProjectionMatrix, 64)
        copyWithOffset(cacheUBOBuffer, CameraWorker.#position, 80)
    }

    static previousRotationLength = 0
    static currentRotationLength = 0

    static execute() {
        const now = performance.now()
        elapsed = now - then
        then = now

        if (needsUpdate) {
            const incrementTranslation = 1 - Math.pow(.001, elapsed * nBuffer[4])
            const incrementRotation = 1 - Math.pow(.001, elapsed * nBuffer[5])
            vec3.lerp(CameraWorker.currentTranslation, CameraWorker.currentTranslation, CameraWorker.#translationBuffer, incrementTranslation)

            CameraWorker.previousRotationLength = quat.length(CameraWorker.currentRotation)
            quat.slerp(CameraWorker.currentRotation, CameraWorker.currentRotation, CameraWorker.#rotationBuffer, incrementRotation)
            CameraWorker.currentRotationLength = quat.length(CameraWorker.currentRotation)

            if (!vec3.equals(CameraWorker.currentTranslation, CameraWorker.#translationBuffer) || CameraWorker.currentRotationLength !== CameraWorker.previousRotationLength) {
                CameraWorker.#updateView()
                nBuffer[3] = 1
            } else {
                needsUpdate = false
                nBuffer[0] = 0
            }
        }

        if (nBuffer[0] === 1) {
            needsUpdate = true
            CameraWorker.#updateView()
            nBuffer[0] = 0
            nBuffer[3] = 1
        }
        if (nBuffer[1] === 1 || CameraWorker.isOrtho) {
            CameraWorker.#updateProjection()
            nBuffer[1] = 0
            nBuffer[3] = 1
        }

    }
}

self.onmessage = (event) => {
    if (!CameraWorker.initialized)
        CameraWorker.initialize(<Float32Array[]>event.data)
    CameraWorker.execute()
}