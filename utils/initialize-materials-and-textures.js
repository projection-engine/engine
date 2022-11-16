import GPUAPI from "../lib/rendering/GPUAPI";
import TEMPLATE_VERTEX_SHADER from "../shaders/DEFAULT_MATERIAL.vert";
import SIMPLE_MATERIAL from "../shaders/DEFAULT_MATERIAL.frag";
import SIMPLE_MATERIAL_CUBEMAP from "../shaders/SIMPLE_MATERIAL_CUBEMAP.frag";

import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import FALLBACK_MATERIAL from "../static/FALLBACK_MATERIAL";
import getTerrainMaterial from "./get-terrain-material";
import TERRAIN_MATERIAL from "../static/TERRAIN_MATERIAL";

export default async function initializeMaterialsAndTextures(){

    GPUAPI.allocateMaterial(
        {
            vertex: TEMPLATE_VERTEX_SHADER,
            fragment: SIMPLE_MATERIAL,
            cubeMapShaderCode: SIMPLE_MATERIAL_CUBEMAP,
            settings: {
                shadingType: MATERIAL_RENDERING_TYPES.DEFERRED
            }
        },
        FALLBACK_MATERIAL
    )

    for (let i = 0; i < 3; i++) {
        GPUAPI.allocateMaterial({
            vertex: TEMPLATE_VERTEX_SHADER,
            fragment: getTerrainMaterial(i),
            cubeMapShaderCode: SIMPLE_MATERIAL_CUBEMAP,
            settings: {
                shadingType: MATERIAL_RENDERING_TYPES.DEFERRED
            }
        }, TERRAIN_MATERIAL + (i + 1))
    }
}