import Component from "../../instances/components/Component";

export default [
    Component.group("SPECULAR_LIGHT", [
        Component.number("LOD", "mipmaps", 10, 1, 1, false, true, "isDiffuse"),
    ]),
    Component.group("CULLING", [
        Component.number("MAX_DISTANCE", "maxDistance",  undefined, 0),
    ])
]