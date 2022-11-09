import Component from "../../templates/components/Component";

export default  [
    Component.number("FOV", "fov", 150, 10),
    Component.group("MOTION_BLUR", [
        Component.boolean("ENABLED", "motionBlurEnabled"),
    ]),
    Component.group("ORTHO_PROJECTION", [
        Component.boolean("ENABLED", "ortho"),
        Component.number("SIZE", "size", 150, 1)
    ]),

    Component.group("ASPECT_RATIO", [
        Component.boolean("DYNAMIC", "dynamicAspectRatio"),
        Component.number("VALUE", "aspectRatio", undefined, undefined, undefined, false, true, "dynamicAspectRatio")
    ]),

    Component.group("VIEW_PLANES", [
        Component.number("FAR", "zFar", undefined,0, .01),
        Component.number("NEAR", "zNear", undefined,0, .01),
    ]),
    Component.group("VIGNETTE", [
        Component.boolean("ENABLED", "vignette"),
        Component.number("STRENGTH", "vignetteStrength", undefined,0, .0001),
    ]),


    Component.group("DISTORTION", [
        Component.boolean("ENABLED", "distortion"),
        Component.number("STRENGTH", "distortionStrength", undefined,0, .0001),
    ]),

    Component.group("CHROMATIC_ABERRATION", [
        Component.boolean("ENABLED", "chromaticAberration"),
        Component.number("STRENGTH", "chromaticAberrationStrength", undefined,0, .0001),
    ]),

    Component.group("FILM_GRAIN", [
        Component.boolean("ENABLED", "filmGrain"),
        Component.number("STRENGTH", "filmGrainStrength", undefined,0, .0001),
    ]),

    Component.group("BLOOM", [
        Component.boolean("ENABLED", "bloom"),
        Component.number("THRESHOLD", "bloomThreshold", undefined,0, .0001),
    ]),

    Component.group("COLOR_CORRECTION", [
        Component.number("GAMMA", "gamma", 10, .1, .001),
        Component.number("EXPOSURE", "exposure", undefined, 0, .001),
    ])
]