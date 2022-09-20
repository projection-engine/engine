import FALLBACK_MATERIAL from "./FALLBACK_MATERIAL";

export const DEFAULT_MATRICES = [
    {
        key: "settings",
        data: [
            0, 0, 0, // ALBEDO, NORMAL, ROUGHNESS,
            0, 0, 0, // METALLIC, AO, EMISSION

            1, 1, 1 // AO_SCALE, METALLIC_SCALE, ROUGHNESS_SCALE
        ]
    },
    {
        key: "rgbSamplerScales",
        data: [
            1, 1, 1, // ALBEDO_SCALE
            1, 1, 1, // NORMAL_SCALE
            1, 1, 1 // EMISSION_SCALE
        ]
    },

    {
        key: "fallbackValues",
        data: [
            .5, .5, .5, // ALBEDO_FALLBACK
            0, 0, 0, // EMISSION_FALLBACK
            .5, .5, 0 // ROUGHNESS, METALLIC
        ]
    },
]
export default {
    original: FALLBACK_MATERIAL,
    uniformData: [
        ...DEFAULT_MATRICES,
        {key: "albedo"},
        {key: "normal"},
        {key: "roughness"},
        {key: "metallic"},
        {key: "ao"},
        {key: "emission"}
    ]
}