import Component from "../../templates/components/Component";

export default [

    Component.group("PIVOT_POINT", [
        Component.array(["X", "Y", "Z"], "pivotPoint",   .001, undefined, undefined, false, undefined, [0, 0, 0])
    ]),

    Component.group("TRANSLATION", [
        Component.boolean("LOCKED", "lockedTranslation"),
        Component.array(["X", "Y", "Z"], "_translation",   .001, undefined, undefined, false, "lockedTranslation", [0, 0, 0])
    ]),

    Component.group("ROTATION", [
        Component.boolean("LOCKED", "lockedRotation"),
        Component.array(["X", "Y", "Z", "W"], "_rotationQuat",   .001, undefined, undefined, false, "lockedRotation", [0, 0, 0, 1])
    ]),

    Component.group("SCALING_LOCAL", [
        Component.boolean("LOCKED", "lockedScaling"),
        Component.array(["X", "Y", "Z"], "_scaling",   .001, undefined, undefined, false, "lockedScaling", [0, 0, 0])
    ]),


]