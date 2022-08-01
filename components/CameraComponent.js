import Component from "../basic/Component"
import ComponentProps from "../data/ComponentProps";
import CAMERA_PROPS from "../component-props/CAMERA_PROPS";

export default class CameraComponent extends Component {
    get isNative() {
        return true
    }
    _props = CAMERA_PROPS

    fov = 1.57
    aspectRatio = 1
    zFar = 10000
    zNear = .1

    distortion = false
    distortionStrength = 1
    chromaticAberration = false
    chromaticAberrationStrength = 1

    filmGrain = false
    filmGrainStrength = 1
    bloom = false
    bloomStrength = 1
    bloomThreshold = .75
    gamma = 2.2
    exposure = 1

    ortho = false
    size = 100

    constructor(id) {
        super(id)
    }


}

