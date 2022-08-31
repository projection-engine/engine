import Component from "./Component"
import CAMERA_PROPS from "../data/component-props/CAMERA_PROPS";

export default class CameraComponent extends Component {
    _props = CAMERA_PROPS
    name = "CAMERA"

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

