import {mat4, quat, vec3} from "gl-matrix";
import TransformationAPI from "../../api/math/TransformationAPI";


/**
 * @field notificationBuffers {float32array [viewNeedsUpdate, projectionNeedsUpdate, isOrthographic, hasChanged, translationSmoothing, rotationSmoothing]}
 * @field transformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */


const ORTHOGRAPHIC = 1
let needsUpdate = false, then = 0, elapsed = 0
let nBuffer
export default class CameraWorker {
    static #translationBuffer
    static #rotationBuffer

    static #notificationBuffers
    static #position
    static #viewMatrix
    static #projectionMatrix
    static #invViewMatrix
    static #invProjectionMatrix
    static viewProjectionMatrix
    static previousViewProjectionMatrix
    static #staticViewMatrix
    static #initialized = false
    static #projectionBuffer
    static #skyboxProjectionMatrix
    static frameID
    static currentTranslation = TransformationAPI.vec3.create()
    static currentRotation = TransformationAPI.quat.create()
static UBOBuffer
    static initialize(
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
        previousViewProjectionMatrix,
        UBOBuffer
    ) {
        if (CameraWorker.#initialized)
            return
        CameraWorker.previousViewProjectionMatrix = previousViewProjectionMatrix
        CameraWorker.viewProjectionMatrix = viewProjectionMatrix
        CameraWorker.#projectionBuffer = projectionBuffer
        CameraWorker.#initialized = true
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
        const callback = () => {
            CameraWorker.execute()
            CameraWorker.frameID = requestAnimationFrame(callback)
        }
        CameraWorker.updateVP()
        CameraWorker.frameID = requestAnimationFrame(callback)

    }

    static #updateProjection() {
        const isOrthographic = nBuffer[2] === ORTHOGRAPHIC

        const buffer = CameraWorker.#projectionBuffer
        const orthoSize = buffer[4]
        const aR = buffer[3]
        const fov = buffer[2]
        const zFar = buffer[0]
        const zNear = buffer[1]

        if (isOrthographic)
            mat4.ortho(CameraWorker.#projectionMatrix, -orthoSize, orthoSize, -orthoSize / aR, orthoSize / aR, zNear, zFar)
        else
            mat4.perspective(CameraWorker.#projectionMatrix, fov, aR, zNear, zFar)

        mat4.invert(CameraWorker.#invProjectionMatrix, CameraWorker.#projectionMatrix)
        mat4.perspective(CameraWorker.#skyboxProjectionMatrix, fov, aR, .1, 1000)
        CameraWorker.updateVP()
    }

    static #updateStaticViewMatrix() {
        const matrix = mat4.copy(CameraWorker.#staticViewMatrix, CameraWorker.#viewMatrix)
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }

    static updateVP() {
        mat4.copy(CameraWorker.previousViewProjectionMatrix, CameraWorker.viewProjectionMatrix)
        mat4.multiply(CameraWorker.viewProjectionMatrix, CameraWorker.#projectionMatrix, CameraWorker.#viewMatrix)
    }

    static #updateView() {
        mat4.fromRotationTranslation(CameraWorker.#invViewMatrix, CameraWorker.currentRotation, CameraWorker.currentTranslation)
        mat4.invert(CameraWorker.#viewMatrix, CameraWorker.#invViewMatrix)
        const m = CameraWorker.#invViewMatrix
        CameraWorker.#position[0] = m[12]
        CameraWorker.#position[1] = m[13]
        CameraWorker.#position[2] = m[14]

        CameraWorker.updateVP()

        const a = CameraWorker.previousViewProjectionMatrix
        const p = CameraWorker.#position
        const cacheUBOBuffer = CameraWorker.UBOBuffer

        mat4.copy(cacheUBOBuffer, CameraWorker.viewProjectionMatrix)
        cacheUBOBuffer[16] = p[0]
        cacheUBOBuffer[17] = p[1]
        cacheUBOBuffer[18] = p[2]
        cacheUBOBuffer[19] = 0
        cacheUBOBuffer[20] = a[0];
        cacheUBOBuffer[21] = a[1];
        cacheUBOBuffer[22] = a[2];
        cacheUBOBuffer[23] = a[3];
        cacheUBOBuffer[24] = a[4];
        cacheUBOBuffer[25] = a[5];
        cacheUBOBuffer[26] = a[6];
        cacheUBOBuffer[27] = a[7];
        cacheUBOBuffer[28] = a[8];
        cacheUBOBuffer[29] = a[9];
        cacheUBOBuffer[30] = a[10];
        cacheUBOBuffer[31] = a[11];
        cacheUBOBuffer[32] = a[12];
        cacheUBOBuffer[33] = a[13];
        cacheUBOBuffer[34] = a[14];
        cacheUBOBuffer[35] = a[15];

        CameraWorker.#updateStaticViewMatrix()
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
        if (nBuffer[1] === 1) {
            CameraWorker.#updateProjection()
            nBuffer[1] = 0
            nBuffer[3] = 1
        }

    }
}