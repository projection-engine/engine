import StaticUBOs from "../lib/StaticUBOs";

const U_INT = new Uint8Array(1)
const FLOAT = new Float32Array(1)
export default class PostProcessingEffects {
    zNear = .1
    zFar = 1000
    fov = Math.PI / 2
    aspectRatio = 1
    size = 50

    DOF = false
    _focusDistanceDOF = 10
    _apertureDOF = 1.2
    _focalLengthDOF = 5
    _samplesDOF = 100


    _bloom = false

    _filmGrain = false
    _filmGrainStrength = 1.

    _vignetteStrength = .25
    _vignetteEnabled = false

    bloomThreshold = .75
    bloomQuality = 8
    bloomOffset = 0
    _gamma = 2.2
    _exposure = 1.


    _chromaticAberration = false
    _chromaticAberrationStrength = 1

    _distortion = false
    _distortionStrength = 1

    cameraMotionBlur = false

    get vignetteStrength() {
        return this._vignetteStrength
    }

    set vignetteStrength(data) {
        this._vignetteStrength = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("vignetteStrength", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get vignetteEnabled() {
        return this._vignetteEnabled
    }

    set vignetteEnabled(data) {
        this._vignetteEnabled = data
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = data ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("vignetteEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get filmGrain() {
        return this._filmGrain
    }

    get filmGrainStrength() {
        return this._filmGrainStrength
    }

    set filmGrain(data) {
        this._filmGrain = data
        FLOAT[0] = data ? 1 : 0
        StaticUBOs.frameCompositionUBO.bind()
        StaticUBOs.frameCompositionUBO.updateData("filmGrainEnabled", FLOAT)
        StaticUBOs.frameCompositionUBO.unbind()
    }

    set filmGrainStrength(data) {
        this._filmGrainStrength = data
        StaticUBOs.frameCompositionUBO.bind()
        FLOAT[0] = data
        StaticUBOs.frameCompositionUBO.updateData("filmGrainStrength", FLOAT)
        StaticUBOs.frameCompositionUBO.unbind()
    }


    get gamma() {
        return this._gamma
    }

    get exposure() {
        return this._exposure
    }

    get focusDistanceDOF() {
        return this._focusDistanceDOF
    }
    set focusDistanceDOF(data) {
        this._focusDistanceDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("focusDistanceDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }
    get apertureDOF() {
        return this._apertureDOF
    }
    set apertureDOF(data) {
        this._apertureDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("apertureDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }
    get focalLengthDOF() {
        return this._focalLengthDOF
    }
    set focalLengthDOF(data) {
        this._focalLengthDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("focalLengthDOF",FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }
    get samplesDOF() {
        return this._samplesDOF
    }
    set samplesDOF(data) {
        this._samplesDOF = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("samplesDOF", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }



    set gamma(data) {
        this._gamma = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("gamma", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    set exposure(data) {
        this._exposure = data
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = data
        StaticUBOs.lensPostProcessingUBO.updateData("exposure", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get distortion() {
        return this._distortion
    }

    set distortion(v) {
        this._distortion = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("distortionEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get chromaticAberration() {
        return this._chromaticAberration
    }

    set chromaticAberration(v) {
        this._chromaticAberration = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("chromaticAberrationEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get bloom() {
        return this._bloom
    }

    set bloom(v) {
        this._bloom = v
        StaticUBOs.lensPostProcessingUBO.bind()
        U_INT[0] = v ? 1 : 0
        StaticUBOs.lensPostProcessingUBO.updateData("bloomEnabled", U_INT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get chromaticAberrationStrength() {
        return this._chromaticAberrationStrength
    }

    set chromaticAberrationStrength(v) {
        this._chromaticAberrationStrength = v
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = v
        StaticUBOs.lensPostProcessingUBO.updateData("chromaticAberrationIntensity", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

    get distortionStrength() {
        return this._distortionStrength
    }

    set distortionStrength(v) {
        this._distortionStrength = v
        StaticUBOs.lensPostProcessingUBO.bind()
        FLOAT[0] = v
        StaticUBOs.lensPostProcessingUBO.updateData("distortionIntensity", FLOAT)
        StaticUBOs.lensPostProcessingUBO.unbind()
    }

}