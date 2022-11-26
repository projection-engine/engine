import Engine from "../../Engine";
import GPU from "../../GPU";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import GlobalIlluminationPass from "./GlobalIlluminationPass";
import DirectionalShadows from "../occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../occlusion/OmnidirectionalShadows";
import VisibilityBuffer from "./VisibilityBuffer";
import COMPONENTS from "../../static/COMPONENTS";
import Shader from "../../instances/Shader";
import CameraAPI from "../../lib/utils/CameraAPI";

let texOffset
export default class SceneRenderer {
    static shader

    static draw(useCustomView, viewProjection, cameraPosition) {
        const entities = Engine.data.meshes
        const size = entities.length
        const shader = SceneRenderer.shader
        if (!shader) return
        const uniforms = shader.uniformMap

        shader.bind()

        if(!useCustomView){
            gpu.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
            gpu.uniform3fv(uniforms.cameraPosition, CameraAPI.position)
        }
        else{
            gpu.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
            gpu.uniform3fv(uniforms.cameraPosition, cameraPosition)
        }


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
        gpu.uniform1f(uniforms.elapsedTime, Engine.elapsed)

        for (let i = 0; i < size; i++) {
            texOffset = 7
            const entity = entities[i]
            const mesh = entity.__meshRef

            if (!entity.active || !mesh)
                continue

            const material = entity.__materialRef
            if (material) {

                gpu.uniform1i(uniforms.isAlphaTested, material.isAlphaTested ? 0 : 1)
                gpu.uniform1i(uniforms.materialID, material.bindID)
                const data = material.uniformValues, toBind = material.uniforms
                for (let j = 0; j < toBind.length; j++) {
                    const current = toBind[j]
                    const dataAttribute = data[current.key]
                    Shader.bind(uniforms[current.key], dataAttribute, current.type, texOffset, () => texOffset++)
                }
            } else {
                gpu.uniform1i(uniforms.isAlphaTested, 0)
                gpu.uniform1i(uniforms.materialID, -1)
            }
            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}