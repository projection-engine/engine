import Component from "./Component"
import CAMERA_PROPS from "../../static/component-props/CAMERA_PROPS";

export default class CameraComponent extends Component {
    _props = CAMERA_PROPS
    name = "CAMERA"

    fov = 90

    dynamicAspectRatio = true
    aspectRatio = 1
    zFar = 10000
    zNear = .1

    distortion = false
    distortionStrength = 1
    chromaticAberration = false
    chromaticAberrationStrength = 1
    vignette = false
    vignetteStrength = .25
    filmGrain = false
    filmGrainStrength = 1
    bloom = false

    bloomThreshold = .75
    gamma = 2.2
    exposure = 1
    motionBlurEnabled = true

    ortho = false
    size = 100
}

