import FrameComposition from "../runtime/post-processing/FrameComposition";
import LensPostProcessing from "../runtime/post-processing/LensPostProcessing";

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
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("vignetteStrength", new Float32Array([data]))
        FrameComposition.UBO.unbind()
    }

    get vignetteEnabled() {
        return this._vignetteEnabled
    }

    set vignetteEnabled(data) {
        this._vignetteEnabled = data
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("vignetteEnabled", new Uint8Array([data ? 1 : 0]))
        FrameComposition.UBO.unbind()
    }

    get filmGrain() {
        return this._filmGrain
    }

    get filmGrainStrength() {
        return this._filmGrainStrength
    }

    set filmGrain(data) {
        this._filmGrain = data
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("filmGrainEnabled", new Float32Array([data ? 1 : 0]))
        FrameComposition.UBO.unbind()
    }

    set filmGrainStrength(data) {
        this._filmGrainStrength = data
        console.trace(data)
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("filmGrainStrength", new Float32Array([data]))
        FrameComposition.UBO.unbind()
    }


    get gamma() {
        return this._gamma
    }

    get exposure() {
        return this._exposure
    }

    set gamma(data) {
        this._gamma = data
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("gamma", new Float32Array([data]))
        FrameComposition.UBO.unbind()
    }

    set exposure(data) {
        this._exposure = data
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("exposure", new Float32Array([data]))
        FrameComposition.UBO.unbind()
    }

    get distortion() {
        return this._distortion
    }

    set distortion(v) {
        this._distortion = v
        LensPostProcessing.UBO.bind()
        LensPostProcessing.UBO.updateData("distortionEnabled", new Uint8Array([v ? 1 : 0]))
        LensPostProcessing.UBO.unbind()
    }

    get chromaticAberration() {
        return this._chromaticAberration
    }

    set chromaticAberration(v) {
        this._chromaticAberration = v
        LensPostProcessing.UBO.bind()
        LensPostProcessing.UBO.updateData("chromaticAberrationEnabled", new Float32Array([v ? 1 : 0]))
        LensPostProcessing.UBO.unbind()
    }

    get bloom() {
        return this._bloom
    }

    set bloom(v) {
        this._bloom = v
        LensPostProcessing.UBO.bind()
        LensPostProcessing.UBO.updateData("bloomEnabled", new Float32Array([v ? 1 : 0]))
        LensPostProcessing.UBO.unbind()
    }

    get chromaticAberrationStrength() {
        return this._chromaticAberrationStrength
    }

    set chromaticAberrationStrength(v) {
        this._chromaticAberrationStrength = v
        LensPostProcessing.UBO.bind()
        LensPostProcessing.UBO.updateData("chromaticAberrationIntensity", new Float32Array([v]))
        LensPostProcessing.UBO.unbind()
    }

    get distortionStrength() {
        return this._distortionStrength
    }

    set distortionStrength(v) {
        this._distortionStrength = v
        LensPostProcessing.UBO.bind()
        LensPostProcessing.UBO.updateData("distortionIntensity", new Float32Array([v]))
        LensPostProcessing.UBO.unbind()
    }

}