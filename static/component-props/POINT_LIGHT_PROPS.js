import Component from "../../templates/components/Component";

export default [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", undefined, 0),
    ]),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),

        Component.number("PCF_SAMPLES", "shadowSamples", undefined, 1, 1),
        Component.number("BIAS", "shadowBias", undefined, undefined, .001),
        Component.number("FALLOFF", "shadowAttenuationMinDistance", undefined, 1, undefined, false, false, v => !v.shadowMap),

        Component.number("FAR", "zFar", undefined, undefined, .001),
        Component.number("NEAR", "zNear", undefined, undefined, .001),
        Component.boolean("HAS_SSS", "hasSSS")
    ]),
    Component.group("ATTENUATION", [
        Component.array(["DISTANCE", "DISTANCE_SQUARED"], "attenuation",   undefined, undefined, 0),
        Component.number("CUTOFF_SPHERE", "cutoff", undefined, 1),
        Component.number("OUTER_CUTOFF", "outerCutoff", undefined, 1),

    ]),
]