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
    ]),
    Component.group("SHADOW_VIEW_PLANES", [
        Component.number("FAR", "zFar", undefined, undefined, .001),
        Component.number("NEAR", "zNear", undefined, undefined, .001),
    ]),
    Component.group("ATTENUATION", [
        Component.array(["LINEAR", "DISTANCE", "DISTANCE_SQUARED"], "attenuation", 3, .001)
    ]),
]