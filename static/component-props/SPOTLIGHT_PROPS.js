import Component from "../../templates/components/Component";

export default [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", undefined, 0),
    ]),

    Component.group("DIRECTION", [
        Component.array(["X", "Y", "Z"], "direction")
    ]),
    Component.group("SHADOWS", [
        Component.boolean("HAS_SSS", "hasSSS")
    ]),

    Component.group("ATTENUATION", [
        Component.array(["DISTANCE", "DISTANCE_SQUARED"], "attenuation",   undefined, undefined, 0),
    ]),
    Component.group("CUTOFF", [
        Component.number("RADIUS", "radius", 180, 1, .01),
        Component.number("CUTOFF_DISTANCE", "cutoff", 100, 1, .01),
    ])
]