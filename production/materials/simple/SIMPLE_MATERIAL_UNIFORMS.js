import FALLBACK_MATERIAL from "./FALLBACK_MATERIAL";

export const DEFAULT_MATRICES = [
    {
        key: "settings",
        data: [
            0, 0, 0, // ALBEDO, NORMAL, ROUGHNESS,
            0, 0, 0, // METALLIC, AO, EMISSION

            0, 0, 0
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
        key: "linearSamplerScales",
        data: [
            1, 1, 1, // AO
            1, 1, 1, // METALLIC
            1, 1, 1 // ROUGHNESS
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
    {
        key: "uvScales",
        data: [
            1, 1, 1, 1, // [ALBEDO], [NORMAL]
            1, 1, 1, 1, // [ROUGHNESS], [METALLIC]
            1, 1, 1, 1, // [AO], [EMISSION]
            0, 0, 0, 0  // EMPTY
        ]
    }
]
export default {
    original: FALLBACK_MATERIAL,
    uniformData: [
        ...DEFAULT_MATRICES,
        {key: "albedo", "type": "sampler2D"},
        {key: "normal", "type": "sampler2D"},
        {key: "roughness", "type": "sampler2D"},
        {key: "metallic", "type": "sampler2D"},
        {key: "ao", "type": "sampler2D"},
        {key: "emission", "type": "sampler2D"},
    ]
}