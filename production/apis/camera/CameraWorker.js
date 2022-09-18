import {mat4} from "gl-matrix";

/**
 * @field notificationBuffers {Uint8Array [transformationType, viewNeedsUpdate, projectionNeedsUpdate, isOrthographic]} - transformationType indicates which method will be used (0 for spherical and 1 for direct)
 * @field sphericalTransformationBuffer {float32array [yaw, pitch, radius, centerOn.x, centerOn.y, centerOn.z]}
 * @field defaultTransformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */


const SPHERICAL = 0, ORTHOGRAPHIC = 1
export default class CameraWorker {

    static #defaultTransformationBuffer
    static #sphericalTransformationBuffer
    static #notificationBuffers
    static #position
    static #viewMatrix
    static #projectionMatrix
    static #invViewMatrix
    static #invProjectionMatrix
    static #staticViewMatrix
    static #initialized = false
    static #projectionBuffer
    static #skyboxProjectionMatrix
    static frameID

    static initialize(
        notificationBuffers,
        position,
        viewMatrix,
        projectionMatrix,
        invViewMatrix,
        invProjectionMatrix,
        staticViewMatrix,
        sphericalTransformationBuffer,
        defaultTransformationBuffer,
        skyboxProjectionMatrix,
        projectionBuffer
    ) {


        if (CameraWorker.#initialized)
            return
        CameraWorker.#projectionBuffer = projectionBuffer
        CameraWorker.#initialized = true
        CameraWorker.#sphericalTransformationBuffer = sphericalTransformationBuffer
        CameraWorker.#notificationBuffers = notificationBuffers
        CameraWorker.#position = position
        CameraWorker.#viewMatrix = viewMatrix
        CameraWorker.#projectionMatrix = projectionMatrix
        CameraWorker.#invViewMatrix = invViewMatrix
        CameraWorker.#invProjectionMatrix = invProjectionMatrix
        CameraWorker.#staticViewMatrix = staticViewMatrix
        CameraWorker.#defaultTransformationBuffer = defaultTransformationBuffer
        CameraWorker.#skyboxProjectionMatrix = skyboxProjectionMatrix

        const callback = () => {
            CameraWorker.execute()
            CameraWorker.frameID = requestAnimationFrame(callback)
        }
        CameraWorker.frameID = requestAnimationFrame(callback)
    }

    static #updateProjection() {
        const isOrthographic = CameraWorker.#notificationBuffers[3] === ORTHOGRAPHIC

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
    }

    static #updateStaticViewMatrix() {
        const matrix = mat4.copy(CameraWorker.#staticViewMatrix, CameraWorker.#viewMatrix)
        matrix[12] = matrix[13] = matrix[14] = 0
        return matrix
    }

    static #directTransformation() {
        const buffer = CameraWorker.#defaultTransformationBuffer
        const translation = [buffer[0], buffer[1], buffer[2]]
        const rotation = [buffer[3], buffer[4], buffer[5], buffer[6]]

        mat4.fromRotationTranslation(CameraWorker.#invViewMatrix, rotation, translation)
        mat4.invert(CameraWorker.#viewMatrix, CameraWorker.#invViewMatrix)

        const m = CameraWorker.#invViewMatrix
        CameraWorker.#position[0] = m[12]
        CameraWorker.#position[1] = m[13]
        CameraWorker.#position[2] = m[14]
        CameraWorker.#updateStaticViewMatrix()
    }

    static #sphericalTransformation() {
        const buffer = CameraWorker.#sphericalTransformationBuffer

        const yaw = buffer[0]
        const pitch = buffer[1]
        const radius = buffer[2]
        const centerOn = [buffer[3], buffer[4], buffer[5]]

        const cosPitch = Math.cos(pitch)

        CameraWorker.#position[0] = radius * cosPitch * Math.cos(yaw) + centerOn[0]
        CameraWorker.#position[1] = radius * Math.sin(pitch) + centerOn[1]
        CameraWorker.#position[2] = radius * cosPitch * Math.sin(yaw) + centerOn[2]
        mat4.lookAt(CameraWorker.#viewMatrix, CameraWorker.#position, centerOn, [0, 1, 0])
        mat4.invert(CameraWorker.#invViewMatrix, CameraWorker.#viewMatrix)
        CameraWorker.#updateStaticViewMatrix()


    }

    static execute() {
        if (CameraWorker.#notificationBuffers[1] === 1) {
            if (CameraWorker.#notificationBuffers[0] === SPHERICAL)
                CameraWorker.#sphericalTransformation()
            else
                CameraWorker.#directTransformation()
            CameraWorker.#notificationBuffers[1] = 0 // needsUpdate
        }
        if (CameraWorker.#notificationBuffers[2] === 1) {
            CameraWorker.#updateProjection()
            CameraWorker.#notificationBuffers[2] = 0 // needsUpdate
        }
    }
}