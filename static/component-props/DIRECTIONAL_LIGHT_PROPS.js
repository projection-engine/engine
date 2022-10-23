import Component from "../../lib/components/Component";

export default [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", 100, 0),
    ]),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),
        Component.number("SIZE", "size", undefined, 1, undefined, false, v => !v.shadowMap),

        Component.number("FAR", "zFar", undefined, undefined, undefined, false, true, v => !v.shadowMap),
        Component.number("NEAR", "zNear", undefined, undefined, undefined, false, true, v => !v.shadowMap),

        Component.number("PCF_SAMPLES", "pcfSamples", 10, 1, 1, false, false, v => !v.shadowMap),
    ]),
]