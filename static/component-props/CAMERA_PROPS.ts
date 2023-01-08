import Component from "../../templates/components/Component";

export default  [
    Component.group("CAMERA", [
        Component.number("FOV", "fov", 150, 10),
        Component.number("FAR", "zFar", undefined,0, .01),
        Component.number("NEAR", "zNear", undefined,0, .01),
        Component.boolean("ORTHO_PROJECTION", "ortho")
    ]),

    Component.group("DEPTH_OF_FIELD", [
        Component.boolean("ENABLED", "enabledDOF"),
        Component.group("QUALITY", [
            Component.options("samplesDOF", [{label: "High", value: 150},{label: "Medium", value: 100}, {label: "Low", value: 50}]),
        ]),
        Component.number("FOCUS_DISTANCE", "focusDistanceDOF"),
        Component.number("FOCAL_LENGTH", "focalLengthDOF", undefined, .001),
        Component.number("APERTURE", "apertureDOF", 2, 0)
    ]),

    Component.group("MOTION_BLUR", [
        Component.boolean("PER_OBJECTS", "motionBlurEnabled"),
        Component.boolean("WORLD", "cameraMotionBlur"),
        Component.number("SCALE", "mbVelocityScale", undefined,.0001),
        Component.number("SAMPLES", "mbSamples", undefined,1, 1)
    ]),

    Component.group("ASPECT_RATIO", [
        Component.boolean("DYNAMIC", "dynamicAspectRatio"),
        Component.number("VALUE", "aspectRatio", undefined, undefined, undefined, false, true, "dynamicAspectRatio")
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
        Component.number("SAMPLES", "bloomQuality", undefined,0,1),
        Component.number("OFFSET", "bloomOffset", undefined,0),
    ]),

    Component.group("COLOR_CORRECTION", [
        Component.number("GAMMA", "gamma", 10, .1, .001),
        Component.number("EXPOSURE", "exposure", undefined, 0, .001),
    ])
]