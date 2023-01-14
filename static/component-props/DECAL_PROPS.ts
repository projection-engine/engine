import Component from "../../instances/components/Component";

export default [
    Component.group("ALBEDO", [
        Component.imageTexture("ALBEDO", "albedoID"),
    ]),
    Component.group("METALLIC", [
        Component.imageTexture("METALLIC", "metallicID"),
    ]),
    Component.group("ROUGHNESS", [
        Component.imageTexture("ROUGHNESS", "roughnessID"),
    ]),
    Component.group("AO", [
        Component.imageTexture("AO", "occlusionID"),
    ]),
    Component.group("NORMAL", [
        Component.imageTexture("NORMAL", "normalID"),
    ]),
    Component.group("SSR", [
        Component.boolean("ENABLED", "useSSR"),
    ])
]