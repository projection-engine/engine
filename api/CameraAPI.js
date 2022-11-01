import PostProcessingEffects from "../templates/PostProcessingEffects";
import COMPONENTS from "../static/COMPONENTS.js";
import Engine from "../Engine";
import ENVIRONMENT from "../static/ENVIRONMENT";
import SharedBufferAPI from "./SharedBufferAPI";
import {vec3, vec4} from "gl-matrix";
import ConversionAPI from "./math/ConversionAPI";
import cloneClass from "../utils/clone-class";


/**
 * @field notificationBuffers {float32array [viewNeedsUpdate, projectionNeedsUpdate, isOrthographic, hasChanged, translationSmoothing, rotationSmoothing]}
 * @field transformationBuffer {float32array [translation.x, translation.y, translation.z, rotation.x, rotation.y, rotation.z, rotation.w]}
 * @field projectionBuffer {float32array [zFar, zNear, fov, aR, orthographicSize]}
 */


const ORTHOGRAPHIC = 1, PERSPECTIVE = 0
let notificationBuffers

function getNotificationBuffer() {
    const b = SharedBufferAPI.allocateVector(6, 0)
    b[0] = 1
    b[1] = 1
    b[2] = PERSPECTIVE
    b[3] = 0
    b[4] = .001
    b[5] = .1
    return b
}

export default class CameraAPI {
    static #dynamicAspectRatio = false
    static metadata = new PostProcessingEffects()
    static position = SharedBufferAPI.allocateVector(3)
    static viewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static projectionMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static invViewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static invProjectionMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static staticViewMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static skyboxProjectionMatrix = SharedBufferAPI.allocateMatrix(4, true)
    static #projectionBuffer = SharedBufferAPI.allocateVector(5)
    static translationBuffer = SharedBufferAPI.allocateVector(3)
    static rotationBuffer = SharedBufferAPI.allocateVector(4, 0, true)
    static #notificationBuffers = getNotificationBuffer()
    static #worker
    static #initialized = false

    static initialize() {
        if (CameraAPI.#initialized)
            return
        CameraAPI.#initialized = true

        const w = new Worker("./build/camera-worker.js")
        CameraAPI.#worker = w
        notificationBuffers = CameraAPI.#notificationBuffers
        w.postMessage([
            notificationBuffers,
            CameraAPI.position,
            CameraAPI.viewMatrix,
            CameraAPI.projectionMatrix,
            CameraAPI.invViewMatrix,
            CameraAPI.invProjectionMatrix,
            CameraAPI.staticViewMatrix,
            CameraAPI.translationBuffer,
            CameraAPI.rotationBuffer,
            CameraAPI.skyboxProjectionMatrix,
            CameraAPI.#projectionBuffer
        ])

        new ResizeObserver(CameraAPI.updateAspectRatio)
            .observe(gpu.canvas)
    }

    static updateAspectRatio() {
        const bBox = gpu.canvas.getBoundingClientRect()
        ConversionAPI.canvasBBox = bBox
        if (Engine.environment === ENVIRONMENT.DEV || CameraAPI.#dynamicAspectRatio) {
            CameraAPI.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        }
    }

    static get didChange() {
        return notificationBuffers[3]
    }

    static get isOrthographic() {
        return notificationBuffers[2] === ORTHOGRAPHIC
    }

    static set isOrthographic(data) {
        notificationBuffers[2] = data ? ORTHOGRAPHIC : PERSPECTIVE
        notificationBuffers[1] = 1
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

    static set translationSmoothing(data) {
        notificationBuffers[4] = data
    }

    static get translationSmoothing() {
        return notificationBuffers[4]
    }

    static set rotationSmoothing(data) {
        notificationBuffers[5] = data
    }

    static get rotationSmoothing() {
        return notificationBuffers[5]
    }

    static updateProjection() {
        notificationBuffers[1] = 1
    }

    static updateView() {
        notificationBuffers[0] = 1
    }

    static update(translation, rotation) {
        if (translation != null)
            vec3.copy(CameraAPI.translationBuffer, translation)
        if (rotation != null)
            vec4.copy(CameraAPI.rotationBuffer, rotation)
        notificationBuffers[0] = 1
    }

    static serializeState(translation=CameraAPI.translationBuffer, rotation=CameraAPI.rotationBuffer, rotationSmoothing=CameraAPI.rotationSmoothing, translationSmoothing=CameraAPI.translationSmoothing, metadata=CameraAPI.metadata){
        const state = {rotationSmoothing, translationSmoothing}
        state.metadata = cloneClass(metadata)
        state.rotation = [...rotation]
        state.translation = [...translation]
        return state
    }
    static updateViewTarget(entity) {
        if (!entity?.components || Engine.environment === ENVIRONMENT.DEV)
            return
        const cameraObj = entity.components.get(COMPONENTS.CAMERA)
        if (!cameraObj)
            return

        CameraAPI.zFar = cameraObj.zFar
        CameraAPI.zNear = cameraObj.zNear
        CameraAPI.fov = cameraObj.fov
        CameraAPI.#dynamicAspectRatio = cameraObj.dynamicAspectRatio
        CameraAPI.isOrthographic = cameraObj.ortho

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
        CameraAPI.metadata.size = cameraObj.size

        if (!cameraObj.dynamicAspectRatio)
            CameraAPI.aspectRatio = cameraObj.aspectRatio
        else
            CameraAPI.updateAspectRatio()

        CameraAPI.update(entity._translation, entity._rotationQuat)
        CameraAPI.updateProjection()
    }
}

