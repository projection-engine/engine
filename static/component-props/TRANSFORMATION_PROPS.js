import Component from "../../production/components/Component";

export default  [

    Component.group("TRANSLATION", [
        Component.array(["X", "Y", "Z"], "translation", 3, .001)
    ]),

    Component.group("ROTATION", [
        Component.array(["X", "Y", "Z"], "rotation", 3, .001, undefined, undefined, true)
    ]),

    Component.group("SCALING", [
        Component.array(["X", "Y", "Z"], "scaling", 3, .001, undefined, undefined, false)
    ]),

]