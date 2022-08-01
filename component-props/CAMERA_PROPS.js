import ComponentProps from "../data/ComponentProps";

export default  [
    ComponentProps.number("FOV", "fov", 175, 1, .1, true),
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