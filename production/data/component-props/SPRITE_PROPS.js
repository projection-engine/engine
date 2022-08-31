import Component from "../../templates/Component";

export default [
    Component.imageTexture("IMAGE", "imageID"),
    Component.group("COLOR", [
        Component.boolean("USE_IMAGE_COLORS", "useImageColors"),
        Component.color("COLOR_TO_OVERRIDE", "colorOverride", "useImageColors"),

    ]),
    Component.group("BACKGROUND", [
        Component.color("BACKGROUND_COLOR", "backgroundColor"),
        Component.number("ALPHA", "alpha", 1, 0, .01),
    ]),
    Component.boolean("ALWAYS_FACE_CAMERA", "alwaysFaceCamera"),

]