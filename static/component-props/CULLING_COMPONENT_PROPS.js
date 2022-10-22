import Component from "../../lib/components/Component";

export default [
    Component.group("DISTANCE_CULLING", [
        Component.boolean("ENABLED", "distanceCulling"),
        Component.number("DISTANCE", "distance"),
    ]),
    Component.group("OCCLUSION_CULLING",[
        Component.boolean("ENABLED", "occlusionCulling")
    ])
]