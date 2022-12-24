import Component from "../../templates/components/Component";
import CullingComponent from "../../templates/components/CullingComponent";

export default [
    Component.group("DISTANCE_CULLING", [
        Component.boolean("ENABLED", "distanceCulling"),
        Component.number("MAX_DISTANCE", "distance", undefined, 0, 1, undefined, undefined, comp => !comp.distanceCulling),
    ]),

    Component.group("SCREEN_DOOR", [
        Component.boolean("ENABLED", "screenDoorEffect"),
        Component.number("DISTANCE_MULTIPLIER", "screenDoorEffectDistanceMultiplier", undefined, 0),
    ]),


    Component.group("OCCLUSION_CULLING",[
        Component.boolean("ENABLED", "occlusionCulling")
    ])
]