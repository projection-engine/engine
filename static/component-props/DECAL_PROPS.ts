import Component from "../../instances/components/Component";
import MATERIAL_RENDERING_TYPES from "../MATERIAL_RENDERING_TYPES";

export default [
    Component.group("RENDERING_MODE", [
        Component.options("renderingMode", [
            {
                label:"Isotropic",
                value: MATERIAL_RENDERING_TYPES.ISOTROPIC
            },
            {
                label:"Anisotropic",
                value: MATERIAL_RENDERING_TYPES.ANISOTROPIC
            },
            {
                label:"Sheen",
                value: MATERIAL_RENDERING_TYPES.SHEEN
            },
            {
                label: "Clear-coat",
                value: MATERIAL_RENDERING_TYPES.CLEAR_COAT
            }
        ]),
    ]),

    Component.group("SHEEN_PARAMS", [
        Component.number("SHEEN", "sheen"),
        Component.number("TINT", "sheenTint"),
    ], comp => comp.renderingMode !== MATERIAL_RENDERING_TYPES.SHEEN),

    Component.group("CLEAR_COAT_PARAMS", [
        Component.number("CLEAR_COAT", "clearCoat"),
    ], comp => comp.renderingMode !== MATERIAL_RENDERING_TYPES.CLEAR_COAT),

    Component.group("ANISOTROPIC_PARAMS", [
        Component.number("ROTATION", "anisotropicRotation"),
        Component.number("ANISOTROPY", "anisotropy", 1, 0)
    ], comp => comp.renderingMode !== MATERIAL_RENDERING_TYPES.ANISOTROPIC),

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
    ]),

]