import TERRAIN_LAYERED from "../../../production/materials/terrain-layered/TERRAIN_MATERIAL";
import TERRAIN_MATERIAL_UNIFORMS from "../../../static/templates/TERRAIN_MATERIAL_UNIFORMS";
import DATA_TYPES from "../../../static/DATA_TYPES";

export default function compileTerrainMaterial(layers, layerController) {
    const multipliers = {
        ...TERRAIN_MATERIAL_UNIFORMS[0],
        data: (new Array(layers.length)).fill(1)
    }
    const uniforms = [
        multipliers,
        {
            ...TERRAIN_MATERIAL_UNIFORMS[1],
            data: layerController
        }
    ]
    for (let i = 0; i < layers.length; i++) {
        const {
            albedo, albedoMultiplier,
            normal, normalMultiplier,
            roughness, roughnessMultiplier
        } = layers[i]

        const mIndex = i * 3
        multipliers[mIndex] = albedoMultiplier
        multipliers[mIndex + 1] = normalMultiplier
        multipliers[mIndex + 2] = roughnessMultiplier
        uniforms.push(
            {
                key: "albedo" + i,
                type:  DATA_TYPES.TEXTURE,
                data: albedo
            },

            {
                key: "normal" + i,
                type: DATA_TYPES.TEXTURE,
                data: normal
            },
            {
                key: "roughness" + i,
                type: DATA_TYPES.TEXTURE,
                data: roughness
            },
        )

    }
    return {
        original: TERRAIN_LAYERED + layers.length,
        uniformData: uniforms
    }
}