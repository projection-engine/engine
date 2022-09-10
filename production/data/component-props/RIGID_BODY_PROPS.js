import Component from "../../components/Component";

export default  [
    Component.number("FOV", "fov", 175, 1, .1, true),
    Component.group("ORTHO_PROJECTION", [
        Component.boolean("ORTHO", "ortho"),
        Component.number("SIZE", "size", 175, 1)
    ]),
]