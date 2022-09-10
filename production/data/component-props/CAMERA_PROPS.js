import Component from "../../components/Component";

export default  [
    Component.number("FOV", "fov", 175, 1, .1, true),
    Component.group("ORTHO_PROJECTION", [
        Component.boolean("ENABLED", "ortho"),
        Component.number("SIZE", "size", 175, 1)
    ]),

    Component.group("VIEW_PLANES", [
        Component.number("FAR", "zFar"),
        Component.number("NEAR", "zNear"),
    ]),

    Component.group("DISTORTION", [
        Component.boolean("ENABLED", "distortion"),
        Component.number("STRENGTH", "distortionStrength"),
    ]),

    Component.group("CHROMATIC_ABERRATION", [
        Component.boolean("ENABLED", "chromaticAberration"),
        Component.number("STRENGTH", "chromaticAberrationStrength"),
    ]),

    Component.group("FILM_GRAIN", [
        Component.boolean("ENABLED", "filmGrain"),
        Component.number("STRENGTH", "filmGrainStrength")
    ]),

    Component.group("BLOOM", [
        Component.boolean("ENABLED", "bloom"),
        Component.number("STRENGTH", "bloomStrength"),
        Component.number("THRESHOLD", "bloomThreshold"),
    ]),

    Component.group("COLOR_CORRECTION", [
        Component.number("GAMMA", "gamma", 10, .1),
        Component.number("EXPOSURE", "exposure"),
    ])
]