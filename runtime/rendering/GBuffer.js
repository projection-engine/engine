import GPU from "../../GPU";
import VisibilityBuffer from "./VisibilityBuffer";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "./GlobalIlluminationPass";
import DirectionalShadows from "../occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../occlusion/OmnidirectionalShadows";

let shader, uniforms
let albedo, buffer
export default class GBuffer {
    static #initialized = false
    static gBuffer
    static albedoSampler
    static behaviourSampler


    static initialize() {
        if (GBuffer.#initialized)
            return
        GBuffer.#initialized = true
        GBuffer.albedoSampler = GBuffer.gBuffer.colors[0]
        GBuffer.behaviourSampler = GBuffer.gBuffer.colors[1]
        buffer = GBuffer.gBuffer
        albedo = GBuffer.albedoSampler
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.DEFERRED_SHADING)
        uniforms = shader.uniformMap
    }

    static drawMaterials() {
        buffer.startMapping()
        const materials = VisibilityBuffer.materialsToRender
        for (let i = 0; i < VisibilityBuffer.materialMaxOffset; i++) {
            const material = materials[i]
            if (!material.bindID)
                return
            const shader = material.shader
            shader.bindForUse({
                ...material.uniformData,
                materialID: material.bindID,
                v_position: VisibilityBuffer.positionSampler,
                v_uv: VisibilityBuffer.uvSampler,
                v_entityID: VisibilityBuffer.entityIDSampler,
                v_normal: VisibilityBuffer.normalSampler
            })
            drawQuad()
        }
        buffer.stopMapping()


    }

    static drawToBuffer() {
        shader.bind()

        gpu.uniform1i(uniforms.hasAO, AmbientOcclusion.enabled ? 1 : 0)

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.albedoSampler)
        gpu.uniform1i(uniforms.g_albedo, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.filteredSampler)
        gpu.uniform1i(uniforms.aoSampler, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.behaviourSampler)
        gpu.uniform1i(uniforms.g_behaviour, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.normalSampler)
        gpu.uniform1i(uniforms.g_normal, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.positionSampler)
        gpu.uniform1i(uniforms.v_position, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSGISampler)
        gpu.uniform1i(uniforms.screenSpaceGI, 5)

        gpu.activeTexture(gpu.TEXTURE6)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSRSampler)
        gpu.uniform1i(uniforms.screenSpaceReflections, 6)

        gpu.activeTexture(gpu.TEXTURE7)
        gpu.bindTexture(gpu.TEXTURE_2D, DirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadowMapTexture, 7)

        gpu.activeTexture(gpu.TEXTURE8)
        gpu.bindTexture(gpu.TEXTURE_2D, GPU.BRDF)
        gpu.uniform1i(uniforms.brdfSampler, 8)

        gpu.activeTexture(gpu.TEXTURE9)
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, OmnidirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadowCube, 9)

        drawQuad()
    }
}