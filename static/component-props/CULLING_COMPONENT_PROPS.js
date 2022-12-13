import Component from "../../templates/components/Component";

export default [
    Component.group("DISTANCE_CULLING", [
        Component.boolean("ENABLED", "distanceCulling"),
        Component.number("DISTANCE", "distance", undefined, 0, 1, undefined, undefined, comp => !comp.distanceCulling),
    ]),
    Component.group("OCCLUSION_CULLING",[
        Component.boolean("ENABLED", "occlusionCulling")
    ])
]