import Component from "../../production/components/Component";

export default  [

    Component.group("TRANSLATION", [
        Component.boolean("LOCKED", "lockedTranslation"),
        Component.array(["X", "Y", "Z"], "translation", 3, .001, undefined, undefined, undefined, "lockedTranslation")
    ]),

    Component.group("ROTATION", [
        Component.boolean("LOCKED", "lockedRotation"),
        Component.array(["X", "Y", "Z"], "rotation", 3, .001, undefined, undefined, true, "lockedRotation")
    ]),

    Component.group("SCALING", [
        Component.boolean("LOCKED", "lockedScaling"),
        Component.array(["X", "Y", "Z"], "scaling", 3, .001, undefined, undefined, false, "lockedScaling")
    ]),

]