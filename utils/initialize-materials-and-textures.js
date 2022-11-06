import ImageWorker from "../workers/image/ImageWorker";
import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";
import BRDF_SAMPLER from "../static/BRDF_SAMPLER";
import GPUAPI from "../api/GPUAPI";
import STATIC_TEXTURES from "../static/resources/STATIC_TEXTURES";
import TEMPLATE_VERTEX_SHADER from "../shaders/TEMPLATE_VERTEX_SHADER.vert";
import SIMPLE_MATERIAL from "../shaders/SIMPLE_MATERIAL.frag";
import SIMPLE_MATERIAL_CUBEMAP from "../shaders/SIMPLE_MATERIAL_CUBEMAP.frag";

import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import FALLBACK_MATERIAL from "../static/FALLBACK_MATERIAL";
import getTerrainMaterial from "./get-terrain-material";
import TERRAIN_MATERIAL from "../static/TERRAIN_MATERIAL";
import GPU from "../GPU";

export default async function initializeMaterialsAndTextures(){
    const bitmap = await ImageWorker.request(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {
        base64: BRDF_SAMPLER,
        onlyData: true
    })
    bitmap.naturalHeight = bitmap.height
    bitmap.naturalWidth = bitmap.width
    GPU.BRDF = (await GPUAPI.allocateTexture({
        img: bitmap,
        internalFormat: "RG32F",
        format: "RG",
        type: "FLOAT",
        minFilter: "LINEAR",
        magFilter: "LINEAR",
        wrapS: "CLAMP_TO_EDGE",
        wrapT: "CLAMP_TO_EDGE"
    }, STATIC_TEXTURES.BRDF)).texture

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