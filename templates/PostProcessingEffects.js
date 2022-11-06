import FrameComposition from "../runtime/post-processing/FrameComposition";

export default class PostProcessingEffects {
    zNear = .1
    zFar = 1000
    fov = Math.PI / 2
    aspectRatio = 1
    size = 50
    _bloom = false
    _filmGrain = false
    _filmGrainStrength = 1.

    _vignetteStrength = .25
    _vignetteEnabled = false

    get vignetteStrength() {
        return this._vignetteStrength
    }

    set vignetteStrength(data) {
        this._vignetteStrength = data
        FrameComposition.UBO.updateData("vignetteStrength", new Float32Array([data]))
    }

    get vignetteEnabled() {
        return this._vignetteEnabled
    }

    set vignetteEnabled(data) {
        this._vignetteEnabled = data
        FrameComposition.UBO.updateData("vignetteEnabled", new Uint8Array([data ? 1 : 0]))
    }

    get filmGrain() {
        return this._filmGrain
    }

    get filmGrainStrength() {
        return this._filmGrainStrength
    }

    set filmGrain(data) {
        this._filmGrain = data
        FrameComposition.UBO.updateData("filmGrainEnabled", new Float32Array([data ? 1 : 0]))
    }

    set filmGrainStrength(data) {
        this._filmGrainStrength = data
        FrameComposition.UBO.updateData("filmGrainStrength", new Float32Array([data]))
    }

    bloomStrength = 1.
    bloomThreshold = .85

    _gamma = 2.2
    _exposure = 1.

    get gamma() {
        return this._gamma
    }

    get exposure() {
        return this._exposure
    }

    set gamma(data) {
        this._gamma = data
        FrameComposition.UBO.updateData("gamma", new Float32Array([data]))
    }

    set exposure(data) {
        this._exposure = data
        FrameComposition.UBO.updateData("exposure", new Float32Array([data]))
    }

    postProcessingEffects = new Uint8Array([1, 1, 1])
    postProcessingStrength = new Uint8Array([1, 1])

    set distortion(v) {
        this.postProcessingEffects[0] = v ? 1 : 0
    }

    set chromaticAberration(v) {
        this.postProcessingEffects[1] = v ? 1 : 0
    }

    set bloom(v) {
        this.postProcessingEffects[2] = v ? 1 : 0
        this._bloom = v
    }

    get distortion() {
        return !!this.postProcessingEffects[0]
    }

    get chromaticAberration() {
        return !!this.postProcessingEffects[1]
    }

    get bloom() {
        return this._bloom
    }

    get distortionStrength() {
        return this.postProcessingStrength[0]
    }

    get chromaticAberrationStrength() {
        return this.postProcessingStrength[1]
    }

    set chromaticAberrationStrength(v) {
        this.postProcessingStrength[1] = v
    }

    set distortionStrength(v) {
        this.postProcessingStrength[0] = v
    }

}