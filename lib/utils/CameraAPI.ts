import CameraEffects from "../../resource-libs/CameraEffects";
import Engine from "../../Engine";
import ENVIRONMENT from "../../static/ENVIRONMENT";
import {vec3, vec4} from "gl-matrix";
import ConversionAPI from "../math/ConversionAPI";
import MotionBlur from "../../runtime/MotionBlur";
import VisibilityRenderer from "../../runtime/VisibilityRenderer";

import GPU from "../../GPU";
import StaticUBOs from "../StaticUBOs";
import Entity from "../../instances/Entity";
import CameraComponent from "../../instances/components/CameraComponent";
import CameraResources from "../../resource-libs/CameraResources";
import CameraSerialization from "../../static/CameraSerialization";
import CameraNotificationDecoder from "../CameraNotificationDecoder";


const TEMPLATE_CAMERA = new CameraComponent()
const toRad = Math.PI / 180
export default class CameraAPI extends CameraResources {
    static #dynamicAspectRatio = false
    static metadata = new CameraEffects()
    static #worker: Worker
    static trackingEntity
    static #initialized = false
    static initialize() {
        if (CameraAPI.#initialized)
            return
        CameraAPI.#initialized = true
        CameraAPI.#worker = new Worker("./camera-worker.js")
        CameraAPI.projectionBuffer[4] = 10
        CameraNotificationDecoder.initialize(CameraAPI.notificationBuffers)
        CameraAPI.#worker.postMessage([
            CameraAPI.notificationBuffers,
            CameraAPI.position,
            CameraAPI.viewMatrix,
            CameraAPI.projectionMatrix,
            CameraAPI.invViewMatrix,
            CameraAPI.invProjectionMatrix,
            CameraAPI.staticViewMatrix,
            CameraAPI.translationBuffer,
            CameraAPI.rotationBuffer,
            CameraAPI.skyboxProjectionMatrix,
            CameraAPI.invSkyboxProjectionMatrix,
            CameraAPI.projectionBuffer,
            CameraAPI.viewProjectionMatrix,
            CameraAPI.viewUBOBuffer,
            CameraAPI.projectionUBOBuffer
        ])
        new ResizeObserver(CameraAPI.updateAspectRatio)
            .observe(GPU.canvas)

    }

    static syncThreads() {
        CameraNotificationDecoder.elapsed = Engine.elapsed
        CameraAPI.#worker.postMessage(0)
    }

    static updateUBOs() {
        const entity = CameraAPI.trackingEntity
        if (entity && entity.__changedBuffer[1])
            CameraAPI.update(entity.translation, entity.rotationQuaternionFinal)

        if (CameraNotificationDecoder.hasChangedProjection === 1) {
            const UBO = StaticUBOs.cameraProjectionUBO

            UBO.bind()
            CameraAPI.projectionUBOBuffer[32] = GPU.bufferResolution[0]
            CameraAPI.projectionUBOBuffer[33] = GPU.bufferResolution[1]
            CameraAPI.projectionUBOBuffer[34] = 2.0 / Math.log2 (CameraAPI.projectionBuffer[0] + 1)

            UBO.updateBuffer(CameraAPI.projectionUBOBuffer)
            UBO.unbind()

            VisibilityRenderer.needsUpdate = true
        }

        if (CameraNotificationDecoder.hasChangedView === 1) {
            const UBO = StaticUBOs.cameraViewUBO
            UBO.bind()
            UBO.updateBuffer(CameraAPI.viewUBOBuffer)
            UBO.unbind()

            VisibilityRenderer.needsUpdate = true
        }
    }

    static updateAspectRatio() {
        const bBox = GPU.canvas.getBoundingClientRect()
        ConversionAPI.canvasBBox = bBox
        if (Engine.environment === ENVIRONMENT.DEV || CameraAPI.#dynamicAspectRatio) {
            CameraAPI.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        }
    }

    static update(translation, rotation) {
        if (translation != null)
            vec3.copy(CameraAPI.translationBuffer, translation)
        if (rotation != null)
            vec4.copy(CameraAPI.rotationBuffer, rotation)
        CameraNotificationDecoder.viewNeedsUpdate = 1
    }

    static serializeState(): CameraSerialization {

        return {
            translationSmoothing: CameraAPI.translationSmoothing,
            metadata: {...CameraAPI.dumpEffects()},
            rotation: [...CameraAPI.rotationBuffer],
            translation: [...CameraAPI.translationBuffer]
        }
    }

    static get hasChangedView() {
        return CameraNotificationDecoder.hasChangedView === 1
    }

    static get isOrthographic(): boolean {
        return CameraNotificationDecoder.projectionType === CameraNotificationDecoder.ORTHOGRAPHIC
    }

    static set isOrthographic(data) {
        CameraNotificationDecoder.projectionType = data ? CameraNotificationDecoder.ORTHOGRAPHIC : CameraNotificationDecoder.PERSPECTIVE
        CameraNotificationDecoder.projectionNeedsUpdate = 1
    }

    static set translationSmoothing(data) {
        CameraNotificationDecoder.translationSmoothing = data
    }

    static get translationSmoothing() {
        return CameraNotificationDecoder.translationSmoothing
    }


    static updateProjection() {
        CameraNotificationDecoder.projectionNeedsUpdate = 1
    }

    static updateView() {
        CameraNotificationDecoder.viewNeedsUpdate = 1
    }

    static restoreState(state: CameraSerialization) {
        const {rotation, translation, translationSmoothing, metadata} = state
        CameraAPI.restoreMetadata(metadata)
        CameraAPI.updateTranslation(translation)
        CameraAPI.updateRotation(rotation)
        CameraAPI.translationSmoothing = translationSmoothing

        CameraAPI.updateView()
    }

    static updateViewTarget(data: Entity | Object) {
        if (!data)
            CameraAPI.trackingEntity = undefined

        let cameraObj
        if (data instanceof Entity) {
            CameraAPI.trackingEntity = data
            cameraObj = data.cameraComponent
        } else
            cameraObj = data

        if (!data)
            return

        cameraObj = {...TEMPLATE_CAMERA, ...cameraObj}

        MotionBlur.enabled = cameraObj.motionBlurEnabled === true || cameraObj.cameraMotionBlur === true

        MotionBlur.velocityScale = cameraObj.mbVelocityScale
        MotionBlur.maxSamples = cameraObj.mbSamples

        CameraAPI.zFar = cameraObj.zFar
        CameraAPI.zNear = cameraObj.zNear
        CameraAPI.fov = cameraObj.fov < Math.PI * 2 ? cameraObj.fov : cameraObj.fov * toRad
        CameraAPI.#dynamicAspectRatio = cameraObj.dynamicAspectRatio
        CameraAPI.isOrthographic = cameraObj.ortho
        CameraAPI.cameraMotionBlur = cameraObj.cameraMotionBlur
        CameraAPI.vignetteEnabled = cameraObj.vignette
        CameraAPI.vignetteStrength = cameraObj.vignetteStrength
        CameraAPI.distortion = cameraObj.distortion
        CameraAPI.distortionStrength = cameraObj.distortionStrength
        CameraAPI.chromaticAberration = cameraObj.chromaticAberration
        CameraAPI.chromaticAberrationStrength = cameraObj.chromaticAberrationStrength
        CameraAPI.filmGrain = cameraObj.filmGrain
        CameraAPI.filmGrainStrength = cameraObj.filmGrainStrength
        CameraAPI.bloom = cameraObj.bloom
        CameraAPI.bloomThreshold = cameraObj.bloomThreshold
        CameraAPI.gamma = cameraObj.gamma
        CameraAPI.exposure = cameraObj.exposure
        CameraAPI.apertureDOF = cameraObj.apertureDOF
        CameraAPI.focalLengthDOF = cameraObj.focalLengthDOF
        CameraAPI.focusDistanceDOF = cameraObj.focusDistanceDOF
        CameraAPI.samplesDOF = cameraObj.samplesDOF
        CameraAPI.DOF = cameraObj.enabledDOF

        if (!cameraObj.dynamicAspectRatio && cameraObj.aspectRatio)
            CameraAPI.aspectRatio = cameraObj.aspectRatio
        else
            CameraAPI.updateAspectRatio()

        if (data instanceof Entity)
            CameraAPI.update(data.translation, data.rotationQuaternionFinal)
        CameraAPI.updateProjection()
    }
}

