import Component from "../../instances/components/Component";
import LIGHT_TYPES from "../LIGHT_TYPES";

function checkShadows(comp){
    return  !comp.shadowMap || comp.type !== LIGHT_TYPES.DIRECTIONAL && comp.type !== LIGHT_TYPES.POINT
}
export default [
    Component.group("TYPE", [
        Component.options("type", [
            {
                label: "DIRECTIONAL_LIGHT",
                value: LIGHT_TYPES.DIRECTIONAL
            },
            {
                label: "SPOTLIGHT",
                value: LIGHT_TYPES.SPOT
            },
            {
                label: "POINT_LIGHT",
                value: LIGHT_TYPES.POINT
            },

            {
                label: "SPHERE_AREA",
                value: LIGHT_TYPES.SPHERE
            },
            {
                label: "DISK_AREA",
                value: LIGHT_TYPES.DISK
            },
            {
                label: "PLANE_AREA",
                value: LIGHT_TYPES.PLANE
            }
        ]),
    ]),

    Component.group("AREA_LIGHT", [
        Component.number("RADIUS", "areaRadius", undefined, 0, undefined,undefined,undefined,comp => comp.type === LIGHT_TYPES.PLANE),

        Component.number("WIDTH", "planeAreaWidth", undefined, 0, undefined,undefined,undefined,comp => comp.type !== LIGHT_TYPES.PLANE),
        Component.number("HEIGHT", "planeAreaHeight", undefined, 0, undefined,undefined,undefined,comp => comp.type !== LIGHT_TYPES.PLANE)
    ], comp => comp.type !== LIGHT_TYPES.SPHERE && comp.type !== LIGHT_TYPES.DISK && comp.type !== LIGHT_TYPES.PLANE),

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", 100, 0),
    ]),

    Component.group("CENTER_POINT", [
        Component.array(["X", "Y", "Z"], "center",  undefined, undefined, undefined, false, undefined)
    ], comp => comp.type !== LIGHT_TYPES.DIRECTIONAL),

    Component.group("ATTENUATION", [
        Component.array(["DISTANCE", "DISTANCE_SQUARED"], "attenuation",   undefined, undefined, 0),
    ], comp => comp.type === LIGHT_TYPES.DIRECTIONAL),

    Component.group("CUTOFF", [
        Component.number("SMOOTHING", "smoothing", 1, 0, .01),
        Component.number("MAX_DISTANCE", "cutoff", 100, 1, .1),
        Component.number("RADIUS", "radius", 180, 1, .01, undefined, undefined, comp => comp.type !== LIGHT_TYPES.SPOT),
    ], comp => comp.type === LIGHT_TYPES.DIRECTIONAL),

    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),
        Component.number("SIZE", "size", undefined, 1, undefined, false, false, comp => !comp.shadowMap || comp.type !== LIGHT_TYPES.DIRECTIONAL),
        Component.number("FAR", "zFar", undefined, undefined, .001, false, false, checkShadows),
        Component.number("NEAR", "zNear", undefined, undefined, .001, false, false,checkShadows),
        Component.number("BIAS", "shadowBias", undefined, undefined, .00001, false, undefined, checkShadows),
        Component.number("PCF_SAMPLES", "shadowSamples", 10, 1, 1, false, false, checkShadows),
        Component.number("FALLOFF", "shadowAttenuationMinDistance", undefined, 1, .001, false, false, checkShadows),
        Component.boolean("HAS_SSS", "hasSSS")

    ]),



]