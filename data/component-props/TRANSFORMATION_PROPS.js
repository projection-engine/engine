import ComponentProps from "../../services/ComponentProps";

export default  [

    ComponentProps.group("TRANSLATION", [
        ComponentProps.array(["X", "Y", "Z"], "translation", 3, .001)
    ]),

    ComponentProps.group("ROTATION", [
        ComponentProps.array(["X", "Y", "Z"], "rotation", 3, .001, undefined, undefined, true, "lockedRotation")
    ]),

    ComponentProps.group("SCALING", [
        ComponentProps.array(["X", "Y", "Z"], "scaling", 3, .001, undefined, undefined, false, "lockedScaling")
    ]),

]