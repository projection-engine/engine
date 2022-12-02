import Component from "../../templates/components/Component";

export default [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", undefined, 0),
    ]),

    Component.group("DIRECTION", [
        Component.array(["X", "Y", "Z"], "direction")
    ]),

    Component.group("ATTENUATION", [
        Component.array(["DISTANCE", "DISTANCE_SQUARED"], "attenuation",   undefined, undefined, 0),
        Component.number("CUTOFF", "radius", undefined, 1, .01),
    ]),
]