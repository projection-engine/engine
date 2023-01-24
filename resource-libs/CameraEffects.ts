import StaticUBOs from "../lib/StaticUBOs";
import CameraEffectsSerialization from "../static/CameraEffectsSerialization";

const U_INT = new Uint8Array(1)
const FLOAT = new Float32Array(1)
export default class CameraEffects {
    static cameraMotionBlur = false
    static #bloom = false
    static #filmGrain = false
    static #vignetteEnabled = false
    static #chromaticAberration = false
    static #distortion = false
    static DOF = false
    static zNear = .1
    static zFar = 1000
    static fov = Math.PI / 2
    static aspectRatio = 1
    static size = 50
    static #focusDistanceDOF = 10
    static #apertureDOF = 1.2
    static #focalLengthDOF = 5
    static #samplesDOF = 100
    static #filmGrainStrength = 1.
    static #vignetteStrength = .25
    static bloomThreshold = .75
    static bloomQuality = 8
    static bloomOffset = 0
    static #gamma = 2.2
    static #exposure = 1.
    static #chromaticAberrationStrength = 1
    static #distortionStrength = 1


    static restoreMetadata(data: CameraEffectsSerialization) {
        CameraEffects.DOF = data.DOF
        CameraEffects.bloom = data.bloom
        CameraEffects.filmGrain = data.filmGrain
        CameraEffects.vignetteEnabled = data.vignetteEnabled
        CameraEffects.chromaticAberration = data.chromaticAberration
        CameraEffects.distortion = data.distortion
        CameraEffects.cameraMotionBlur = data.cameraMotionBlur
        CameraEffects.zNear = data.zNear
        CameraEffects.zFar = data.zFar
        CameraEffects.fov = data.fov
        CameraEffects.aspectRatio = data.aspectRatio
        CameraEffects.size = data.size
        CameraEffects.focusDistanceDOF = data.focusDistanceDOF
        CameraEffects.apertureDOF = data.apertureDOF
        CameraEffects.focalLengthDOF = data.focalLengthDOF
        CameraEffects.samplesDOF = data.samplesDOF
        CameraEffects.filmGrainStrength = data.filmGrainStrength
        CameraEffects.vignetteStrength = data.vignetteStrength
        CameraEffects.bloomThreshold = data.bloomThreshold
        CameraEffects.bloomQuality = data.bloomQuality
        CameraEffects.bloomOffset = data.bloomOffset
        CameraEffects.gamma = data.gamma
        CameraEffects.exposure = data.exposure
        CameraEffects.chromaticAberrationStrength = data.chromaticAberrationStrength
        CameraEffects.distortionStrength = data.distortionStrength
    }

    static dumpEffects(): CameraEffectsSerialization {
        return {
            zNear: CameraEffects.zNear,
            zFar: CameraEffects.zFar,
            fov: CameraEffects.fov,
            aspectRatio: CameraEffects.aspectRatio,
            size: CameraEffects.size,
            focusDistanceDOF: CameraEffects.#focusDistanceDOF,
            apertureDOF: CameraEffects.#apertureDOF,
            focalLengthDOF: CameraEffects.#focalLengthDOF,
            samplesDOF: CameraEffects.#samplesDOF,
            filmGrainStrength: CameraEffects.#filmGrainStrength,
            vignetteStrength: CameraEffects.#vignetteStrength,
            bloomThreshold: CameraEffects.bloomThreshold,
            bloomQuality: CameraEffects.bloomQuality,
            bloomOffset: CameraEffects.bloomOffset,
            gamma: CameraEffects.#gamma,
            exposure: CameraEffects.#exposure,
            chromaticAberrationStrength: CameraEffects.#chromaticAberrationStrength,
            distortionStrength: CameraEffects.#distortionStrength,
            cameraMotionBlur: CameraEffects.cameraMotionBlur,
            DOF: CameraEffects.DOF,
            bloom: CameraEffects.#bloom,
            filmGrain: CameraEffects.#filmGrain,
            vignetteEnabled: CameraEffects.#vignetteEnabled,
            chromaticAberration: CameraEffects.#chromaticAberration,
            distortion: CameraEffects.#distortion,
        }
    }

    static get vignetteStrength() {
        return CameraEffects.#vignetteStrength
    }

    static set vignetteStrength(data) {
        CameraEffects.#vignetteStrength = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("vignetteStrength", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get vignetteEnabled() {
        return CameraEffects.#vignetteEnabled
    }

    static set vignetteEnabled(data) {
        CameraEffects.#vignetteEnabled = data
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = data ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("vignetteEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get filmGrain() {
        return CameraEffects.#filmGrain
    }

    static get filmGrainStrength() {
        return CameraEffects.#filmGrainStrength
    }

    static set filmGrain(data) {
        CameraEffects.#filmGrain = data
        FLOAT[0] = data ? 1 : 0
        StaticUBOs.frameCompositionUBO.bind()
        StaticUBOs.frameCompositionUBO.updateData("filmGrainEnabled", FLOAT)
        StaticUBOs.frameCompositionUBO.unbind()
    }

    static set filmGrainStrength(data) {
        CameraEffects.#filmGrainStrength = data
        StaticUBOs.frameCompositionUBO.bind()
        FLOAT[0] = data
        StaticUBOs.frameCompositionUBO.updateData("filmGrainStrength", FLOAT)
        StaticUBOs.frameCompositionUBO.unbind()
    }


    static get gamma() {
        return CameraEffects.#gamma
    }

    static get exposure() {
        return CameraEffects.#exposure
    }

    static get focusDistanceDOF() {
        return CameraEffects.#focusDistanceDOF
    }

    static set focusDistanceDOF(data) {
        CameraEffects.#focusDistanceDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("focusDistanceDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get apertureDOF() {
        return CameraEffects.#apertureDOF
    }

    static set apertureDOF(data) {
        CameraEffects.#apertureDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("apertureDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get focalLengthDOF() {
        return CameraEffects.#focalLengthDOF
    }

    static set focalLengthDOF(data) {
        CameraEffects.#focalLengthDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("focalLengthDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get samplesDOF() {
        return CameraEffects.#samplesDOF
    }

    static set samplesDOF(data) {
        CameraEffects.#samplesDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("samplesDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }


    static set gamma(data) {
        CameraEffects.#gamma = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("gamma", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static set exposure(data) {
        CameraEffects.#exposure = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("exposure", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get distortion() {
        return CameraEffects.#distortion
    }

    static set distortion(v) {
        CameraEffects.#distortion = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("distortionEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get chromaticAberration() {
        return CameraEffects.#chromaticAberration
    }

    static set chromaticAberration(v) {
        CameraEffects.#chromaticAberration = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("chromaticAberrationEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get bloom() {
        return CameraEffects.#bloom
    }

    static set bloom(v) {
        CameraEffects.#bloom = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("bloomEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get chromaticAberrationStrength() {
        return CameraEffects.#chromaticAberrationStrength
    }

    static set chromaticAberrationStrength(v) {
        CameraEffects.#chromaticAberrationStrength = v
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = v
        StaticUBOs.lensPostProcessingUBO.updateData("chromaticAberrationIntensity", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    static get distortionStrength() {
        return CameraEffects.#distortionStrength
    }

    static set distortionStrength(v) {
        CameraEffects.#distortionStrength = v
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = v
        StaticUBOs.lensPostProcessingUBO.updateData("distortionIntensity", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

}