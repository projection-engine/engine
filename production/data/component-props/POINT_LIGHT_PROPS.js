import Component from "../../components/Component";

export default  [

    Component.group("INTENSITY_COLOR", [
        Component.color("COLOR", "color"),
        Component.number("INTENSITY", "intensity", 100, 0),
    ]),


    Component.group("SHADOWS", [
        Component.boolean("ENABLED", "shadowMap"),

        Component.number("FAR", "zFar"),
        Component.number("NEAR", "zNear"),
    ]),
    Component.group("ATTENUATION", [
        Component.array(["X", "Y", "Z"], "attenuation", 2, .01)
    ]),
]