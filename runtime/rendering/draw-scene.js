import Engine from "../../Engine";
import Material from "../../instances/Material";
import GPU from "../../GPU";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "./GlobalIlluminationPass";
import DirectionalShadows from "../occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../occlusion/OmnidirectionalShadows";
import VisibilityBuffer from "./VisibilityBuffer";

export default function drawScene() {
    const entities = Engine.data.meshes
    const size = entities.length
    const shader = Material.uberShader
    const uniforms = shader.uniformMap

    shader.bind()


    gpu.activeTexture(gpu.TEXTURE0)
    gpu.bindTexture(gpu.TEXTURE_2D, GPU.BRDF)
    gpu.uniform1i(uniforms.brdf_sampler, 0)

    gpu.activeTexture(gpu.TEXTURE1)
    gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.filteredSampler)
    gpu.uniform1i(uniforms.SSAO, 1)

    gpu.activeTexture(gpu.TEXTURE2)
    gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSGISampler)
    gpu.uniform1i(uniforms.SSGI, 2)

    gpu.activeTexture(gpu.TEXTURE3)
    gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.SSRSampler)
    gpu.uniform1i(uniforms.SSR, 3)

    gpu.activeTexture(gpu.TEXTURE4)
    gpu.bindTexture(gpu.TEXTURE_2D, DirectionalShadows.sampler)
    gpu.uniform1i(uniforms.shadow_atlas, 4)

    gpu.activeTexture(gpu.TEXTURE5)
    gpu.bindTexture(gpu.TEXTURE_2D, OmnidirectionalShadows.sampler)
    gpu.uniform1i(uniforms.shadow_cube, 5)

    gpu.activeTexture(gpu.TEXTURE6)
    gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
    gpu.uniform1i(uniforms.previous_frame, 6)

    gpu.activeTexture(gpu.TEXTURE7)
    gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthEntityIDSampler)
    gpu.uniform1i(uniforms.scene_depth, 7)

    gpu.uniform1i(uniforms.hasAmbientOcclusion, AmbientOcclusion.enabled ? 1 : 0)
    for (let i = 0; i < size; i++) {
        const entity = entities[i]
        const mesh = entity.__meshReference
        // const material = entity.__materialReference

        if (!entity.active || !mesh)
            continue
        gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
        mesh.draw()
    }

}