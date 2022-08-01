import ComponentProps from "../data/ComponentProps";

export default  [

    ComponentProps.group("INTENSITY_COLOR", [
        ComponentProps.color("COLOR", "color"),
        ComponentProps.number("INTENSITY", "color", undefined, undefined, .01),
    ]),


    ComponentProps.group("SHADOWS", [
        ComponentProps.boolean("ENABLED", "shadowMap"),
        ComponentProps.number("SIZE", "size", undefined, 1,1, false, false),
    ]),
    ComponentProps.group("VIEW_PLANES", [
        ComponentProps.number("FAR", "zFar"),
        ComponentProps.number("NEAR", "zNear"),
    ]),
    ComponentProps.group("ATTENUATION", [
        ComponentProps.array(["X", "Y", "Z"], "attenuation", 2, .01)
    ]),
]