import PostProcessing from "../instances/PostProcessing";
import COMPONENTS from "../../static/COMPONENTS.json";
import Engine from "../Engine";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import SharedBufferAPI from "./SharedBufferAPI";

/**
 * @field notificationBuffers {Uint8Array [transformationType, viewNeedsUpdate, projectionNeedsUpdate, isOrthographic]} - transformationType indicates which method will be used (0 for spherical and 1 for direct)
 * @field sphericalTransformationBuffer {float32array [yaw, pitch, radius, centerOn.x, centerOn.y, centerOn.z]}
 * @field defaultTransformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */

const SPHERICAL = 0, DIRECT = 1, ORTHOGRAPHIC = 1, PERSPECTIVE = 0

function getNotificationBuffer() {
    const b = new Uint8Array(new SharedArrayBuffer(4))
    b[0] = DIRECT
    b[1] = 1
    b[2] = 1
    b[3] = PERSPECTIVE
    return b
}

export default class CameraAPI {

    static metadata = new PostProcessing()
    static position = SharedBufferAPI.allocateVector(3)
    static viewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static projectionMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static invViewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static invProjectionMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static staticViewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static skyboxProjectionMatrix = SharedBufferAPI.allocateMatrix(4, true)

    static #projectionBuffer = SharedBufferAPI.allocateVector(5)
    static #defaultTransformationBuffer = SharedBufferAPI.allocateVector(7)
    static #sphericalTransformationBuffer = SharedBufferAPI.allocateVector(6)
    static #notificationBuffers = getNotificationBuffer()
    static #worker
    static #initialized = false


    static initialize() {
        if (CameraAPI.#initialized)
            return

        CameraAPI.#initialized = true

        const w = new Worker("./build/camera-worker.js")
        CameraAPI.#worker = w

        w.postMessage([
           CameraAPI.#notificationBuffers,
           CameraAPI.position,
           CameraAPI.viewMatrix,
           CameraAPI.projectionMatrix,
           CameraAPI.invViewMatrix,
           CameraAPI.invProjectionMatrix,
           CameraAPI.staticViewMatrix,
           CameraAPI.#sphericalTransformationBuffer,
           CameraAPI.#defaultTransformationBuffer,
           CameraAPI.skyboxProjectionMatrix,
           CameraAPI.#projectionBuffer
        ])
    }


    static get isOrthographic() {
        return CameraAPI.#notificationBuffers[3] === ORTHOGRAPHIC
    }

    static set isOrthographic(data) {
        CameraAPI.#notificationBuffers[3] = data ? ORTHOGRAPHIC : PERSPECTIVE
        CameraAPI.#notificationBuffers[2] = 1
    }

    static get zFar() {
        return CameraAPI.#projectionBuffer[0]
    }

    static get zNear() {
        return CameraAPI.#projectionBuffer[1]
    }

    static get fov() {
        return CameraAPI.#projectionBuffer[2]
    }

    static get aspectRatio() {
        return CameraAPI.#projectionBuffer[3]
    }

    static get size() {
        return CameraAPI.#projectionBuffer[4]
    }

    static set zFar(data) {
        CameraAPI.#projectionBuffer[0] = data
    }

    static set zNear(data) {
        CameraAPI.#projectionBuffer[1] = data
    }

    static set fov(data) {
        CameraAPI.#projectionBuffer[2] = data
    }

    static set aspectRatio(data) {
        CameraAPI.#projectionBuffer[3] = data
    }

    static set size(data) {
        CameraAPI.#projectionBuffer[4] = data
    }


    static updateProjection() {
        CameraAPI.#notificationBuffers[2] = 1
    }

    static directTransformation(translation, rotation) {
        const nBuffer = CameraAPI.#notificationBuffers
        nBuffer[0] = DIRECT
        nBuffer[1] = 1

        const buffer = CameraAPI.#defaultTransformationBuffer
        buffer[0] = translation[0]
        buffer[1] = translation[1]
        buffer[2] = translation[2]
        buffer[3] = rotation[0]
        buffer[4] = rotation[1]
        buffer[5] = rotation[2]
        buffer[6] = rotation[3]
    }

    static sphericalTransformation(rotationVec, radius, centerOn) {
        const nBuffer = CameraAPI.#notificationBuffers
        nBuffer[0] = SPHERICAL
        nBuffer[1] = 1

        const buffer = CameraAPI.#sphericalTransformationBuffer
        buffer[0] = rotationVec[0]
        buffer[1] = rotationVec[1]
        buffer[2] = radius
        buffer[3] = centerOn[0]
        buffer[4] = centerOn[1]
        buffer[5] = centerOn[2]
    }

    static updateViewTarget(entity) {
        if (!entity?.components || Engine.environment === ENVIRONMENT.DEV)
            return
        const cameraObj = entity.components.get(COMPONENTS.CAMERA)

        if (!cameraObj)
            return
        CameraAPI.directTransformation(entity.translation, entity._rotationQuat)
        CameraAPI.zFar = cameraObj.zFar
        CameraAPI.zNear = cameraObj.zNear
        CameraAPI.fov = cameraObj.fov
        CameraAPI.aspectRatio = cameraObj.aspectRatio

        CameraAPI.metadata.distortion = cameraObj.distortion
        CameraAPI.metadata.distortionStrength = cameraObj.distortionStrength
        CameraAPI.metadata.chromaticAberration = cameraObj.chromaticAberration
        CameraAPI.metadata.chromaticAberrationStrength = cameraObj.chromaticAberrationStrength
        CameraAPI.metadata.filmGrain = cameraObj.filmGrain
        CameraAPI.metadata.filmGrainStrength = cameraObj.filmGrainStrength
        CameraAPI.metadata.bloom = cameraObj.bloom
        CameraAPI.metadata.bloomStrength = cameraObj.bloomStrength
        CameraAPI.metadata.bloomThreshold = cameraObj.bloomThreshold
        CameraAPI.metadata.gamma = cameraObj.gamma
        CameraAPI.metadata.exposure = cameraObj.exposure
        CameraAPI.isOrthographic = cameraObj.ortho
        CameraAPI.metadata.size = cameraObj.size

        CameraAPI.updateProjection()
    }
}

