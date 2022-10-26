import ImageWorker from "../workers/image/ImageWorker";
import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS";
import BRDF_SAMPLER from "../static/BRDF_SAMPLER";
import GPUController from "../GPUController";
import TEXTURE_FORMATS from "../static/texture/TEXTURE_FORMATS";
import TEXTURE_FILTERING from "../static/texture/TEXTURE_FILTERING";
import TEXTURE_WRAPPING from "../static/texture/TEXTURE_WRAPPING";
import STATIC_TEXTURES from "../static/resources/STATIC_TEXTURES";
import TEMPLATE_VERTEX_SHADER from "../static/TEMPLATE_VERTEX_SHADER";
import FALLBACKGlsl from "../static/SIMPLE_MATERIAL.glsl";
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES";
import FALLBACK_MATERIAL from "../static/FALLBACK_MATERIAL";
import getTerrainMaterial from "./get-terrain-material";
import TERRAIN_MATERIAL from "../static/TERRAIN_MATERIAL";
import GPUResources from "../GPUResources";

export default async function initializeMaterialsAndTextures(){
    const bitmap = await ImageWorker.request(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {
        base64: BRDF_SAMPLER,
        onlyData: true
    })
    GPUResources.BRDF = (await GPUController.allocateTexture({
        img: bitmap,
        internalFormat: TEXTURE_FORMATS.FLOAT_RGBA.internalFormat,

        format: TEXTURE_FORMATS.FLOAT_RGBA.format,
        type: TEXTURE_FORMATS.FLOAT_RGBA.type,

        minFilter: TEXTURE_FILTERING.MIN.LINEAR,
        magFilter: TEXTURE_FILTERING.MAG.LINEAR,
        wrapS: TEXTURE_WRAPPING.CLAMP_TO_EDGE,
        wrapT: TEXTURE_WRAPPING.CLAMP_TO_EDGE
    }, STATIC_TEXTURES.BRDF)).texture

    GPUController.allocateMaterial(
        {
            vertex: TEMPLATE_VERTEX_SHADER,
            fragment: FALLBACKGlsl.fragment,
            cubeMapShaderCode: FALLBACKGlsl.cubeMap,
            settings: {
                shadingType: MATERIAL_RENDERING_TYPES.DEFERRED
            }
        },
        FALLBACK_MATERIAL
    )

    for (let i = 0; i < 3; i++) {
        GPUController.allocateMaterial({
            vertex: TEMPLATE_VERTEX_SHADER,
            fragment: getTerrainMaterial(i),
            cubeMapShaderCode: FALLBACKGlsl.cubeMap,
            settings: {
                shadingType: MATERIAL_RENDERING_TYPES.DEFERRED
            }
        }, TERRAIN_MATERIAL + (i + 1))
    }
}