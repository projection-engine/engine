import Component from "../../libs/basic/Component";

export default  [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "color", undefined, undefined, .01),
    ]),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),
        Component.number("SIZE", "size", undefined, 1,1, false, false),
    ]),
    Component.group("VIEW_PLANES", [
        Component.number("FAR", "zFar"),
        Component.number("NEAR", "zNear"),
    ]),
]