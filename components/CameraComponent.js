import Component from "../basic/Component"
import ComponentProps from "../data/ComponentProps";

export default class CameraComponent extends Component {
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

    _props = [
        ComponentProps.number("FOV", "fov", 175, 1),
        ComponentProps.group("ORTHO_PROJECTION", [
            ComponentProps.boolean("ORTHO", "ortho"),
            ComponentProps.number("SIZE", "size", 175, 1)
        ]),

        ComponentProps.group("VIEW_PLANES", [
            ComponentProps.number("FAR", "zFar"),
            ComponentProps.number("NEAR", "zNear"),
        ]),

        ComponentProps.group("DISTORTION", [
            ComponentProps.boolean("ENABLED", "distortion"),
            ComponentProps.number("STRENGTH", "distortionStrength"),
        ]),

        ComponentProps.group("CHROMATIC_ABERRATION", [
            ComponentProps.boolean("ENABLED", "chromaticAberration"),
            ComponentProps.number("STRENGTH", "chromaticAberrationStrength"),
        ]),

        ComponentProps.group("FILM_GRAIN", [
            ComponentProps.boolean("ENABLED", "filmGrain"),
            ComponentProps.number("STRENGTH", "filmGrainStrength")
        ]),

        ComponentProps.group("BLOOM", [
            ComponentProps.boolean("ENABLED", "bloom"),
            ComponentProps.number("STRENGTH", "bloomStrength"),
            ComponentProps.number("THRESHOLD", "bloomThreshold"),
        ]),

        ComponentProps.group("COLOR_CORRECTION", [
            ComponentProps.number("GAMMA", "gamma", 10, .1),
            ComponentProps.number("EXPOSURE", "exposure"),
        ])
    ]
}

