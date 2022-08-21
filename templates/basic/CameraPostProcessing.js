import {mat4} from "gl-matrix";

export default class CameraPostProcessing {
    zNear = .1
    zFar = 1000
    fov = Math.PI / 2
    aspectRatio = 1
    size = 50
    _bloom = false
    filmGrain = false
    filmGrainStrength = 1.

    bloomStrength = 1.
    bloomThreshold = .85
    gamma = 2.2
    exposure = 1.

    postProcessingEffects = new Uint8Array([1, 1, 1])
    postProcessingStrength = new Uint8Array([1, 1])

    fxaa = true
    FXAASpanMax = 8
    FXAAReduceMin = 1 / 128
    FXAAReduceMul = 1 / 8

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