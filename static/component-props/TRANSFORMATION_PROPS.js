import Component from "../../production/components/Component";

export default  [

    Component.group("TRANSLATION", [
        Component.boolean("LOCKED", "lockedTranslation"),
        Component.array(["X", "Y", "Z"], "_translation", 3, .001, undefined, undefined, false, "lockedTranslation", [0,0,0])
    ]),

    Component.group("ROTATION", [
        Component.boolean("LOCKED", "lockedRotation"),
        Component.array(["X", "Y", "Z", "W"], "_rotationQuat", 3, .001, undefined, undefined, false, "lockedRotation", [0,0,0,1])
    ]),

    Component.group("SCALING_LOCAL", [
        Component.boolean("LOCKED", "lockedScaling"),
        Component.array(["X", "Y", "Z"], "_scaling", 3, .001, undefined, undefined, false, "lockedScaling", [0,0,0])
    ]),

]