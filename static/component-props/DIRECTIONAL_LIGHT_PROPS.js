import Component from "../../production/components/Component";

export default  [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", 100, 0),
    ]),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),
        Component.number("SIZE", "size", undefined, 1,1, false, false),

        Component.number("FAR", "zFar"),
        Component.number("NEAR", "zNear"),
    ]),
]