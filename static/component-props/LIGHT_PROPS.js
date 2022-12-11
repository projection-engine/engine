import Component from "../../templates/components/Component";
import LIGHT_TYPES from "../LIGHT_TYPES";

export default [
    Component.options("TYPE", "type", [
        {
            key: "DIRECTIONAL",
            value: LIGHT_TYPES.DIRECTIONAL
        },
        {
            key: "SPOT",
            value: LIGHT_TYPES.SPOT
        },
        {
            key: "POINT",
            value: LIGHT_TYPES.POINT
        }
    ]),

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", 100, 0),
    ]),

    Component.group("CENTER_POINT", [
        Component.array(["X", "Y", "Z"], "center",  undefined, undefined, undefined, false, undefined, [0, 0, 0])
    ], comp => comp.type !== LIGHT_TYPES.DIRECTIONAL),

    Component.group("ATTENUATION", [
        Component.array(["DISTANCE", "DISTANCE_SQUARED"], "attenuation",   undefined, undefined, 0),
    ], comp => comp.type === LIGHT_TYPES.DIRECTIONAL),

    Component.group("CUTOFF", [
        Component.number("SMOOTHING", "smoothing", 1, 0),
        Component.number("MAX_DISTANCE", "cutoff", 100, 1),
        Component.number("RADIUS", "radius", 180, 1, .01, undefined, undefined, comp => comp.type !== LIGHT_TYPES.SPOT),
    ], comp => comp.type === LIGHT_TYPES.DIRECTIONAL),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),
        Component.number("SIZE", "size", undefined, 1, undefined, false, v => !v.shadowMap, comp => comp.type !== LIGHT_TYPES.DIRECTIONAL),
        Component.number("FAR", "zFar", undefined, undefined, .001, false, true, v => !v.shadowMap),
        Component.number("NEAR", "zNear", undefined, undefined, .001, false, true, v => !v.shadowMap),
        Component.number("BIAS", "shadowBias", undefined, undefined, .00001),
        Component.number("PCF_SAMPLES", "shadowSamples", 10, 1, 1, false, false, v => !v.shadowMap),
        Component.number("FALLOFF", "shadowAttenuationMinDistance", undefined, 1, undefined, false, false, v => !v.shadowMap),
        Component.boolean("HAS_SSS", "hasSSS")

    ]),



]