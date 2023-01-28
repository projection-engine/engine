import Component from "../../instances/components/Component";
import ATMOSPHERE_TYPES from "../ATMOSPHERE_TYPES";

export default [
    Component.group("GLOBAL", [
    Component.number("ELAPSED_TIME", "elapsedTime", undefined, 0),
    Component.number("RAYLEIGH_HEIGHT", "rayleighHeight", undefined, 0, 1),
    Component.number("MIE_HEIGHT", "mieHeight", undefined, 0, 1),
    Component.number("SAMPLES", "maxSamples", undefined, 1, 1),
    Component.number("INTENSITY", "intensity", undefined, 1, 1),
    Component.number("THRESHOLD", "threshold", 0, undefined),
    ]),
    Component.group("RAYLEIGH_BETA_VALUES", [
        Component.array(["R", "G", "B"], "betaRayleigh", 1, undefined, 1),
    ]),
    Component.group("MIE_BETA_VALUES", [
        Component.array(["R", "G", "B"], "betaMie", 1, undefined, 1),
    ]),
    Component.group("MIE_BETA_VALUES", [
        Component.number("ATMOSPHERE", "atmosphereRadius", undefined, 0),
        Component.number("PLANET", "planetRadius", undefined, 0),
    ]),

    Component.group("SCATTERING_FUNCTION", [
        Component.options("renderingType", [
            {
                label: "MIE",
                value: ATMOSPHERE_TYPES.MIE
            },
            {
                label: "RAYLEIGH",
                value: ATMOSPHERE_TYPES.RAYLEIGH
            },
            {
                label: "COMBINED",
                value: ATMOSPHERE_TYPES.COMBINED
            }
        ]),
    ])

]