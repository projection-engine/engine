import Engine from "../../Engine";
import GPU from "../../GPU";
import SSAO from "./SSAO";
import SSGI from "./SSGI";
import DirectionalShadows from "./DirectionalShadows";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityBuffer from "./VisibilityBuffer";
import COMPONENTS from "../../static/COMPONENTS";
import Shader from "../../instances/Shader";
import CameraAPI from "../../lib/utils/CameraAPI";
import SSR from "./SSR";

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

        gpu.uniformMatrix4fv(uniforms.skyboxProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        if (!useCustomView) {
            gpu.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
            gpu.uniform3fv(uniforms.cameraPosition, CameraAPI.position)
        } else {
            gpu.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
            gpu.uniform3fv(uniforms.cameraPosition, cameraPosition)
        }

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GPU.BRDF)
        gpu.uniform1i(uniforms.brdf_sampler, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, SSAO.filteredSampler)
        gpu.uniform1i(uniforms.SSAO, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, SSGI.SSGISampler)
        gpu.uniform1i(uniforms.SSGI, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, SSR.SSRSampler)
        gpu.uniform1i(uniforms.SSR, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, DirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadow_atlas, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, OmnidirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadow_cube, 5)

        gpu.activeTexture(gpu.TEXTURE6)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previous_frame, 6)

        gpu.activeTexture(gpu.TEXTURE7)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthEntityIDSampler)
        gpu.uniform1i(uniforms.scene_depth, 7)

        gpu.uniform1i(uniforms.hasAmbientOcclusion, SSAO.enabled ? 1 : 0)
        gpu.uniform1f(uniforms.elapsedTime, Engine.elapsed)

        let depthMaskState = true, cullFaceState = true

        gpu.enable(gpu.CULL_FACE)
        gpu.cullFace(gpu.BACK)
        gpu.depthMask(true)

        for (let i = 0; i < size; i++) {
            texOffset = 8
            const entity = entities[i]
            const mesh = entity.__meshRef

            if (!entity.active || !mesh)
                continue

            const material = entity.__materialRef
            if (material) {
                gpu.uniform1i(uniforms.noDepthChecking, material.isAlphaTested ? 1 : 0)
                gpu.uniform1i(uniforms.materialID, material.bindID)
                if (material.depthMask !== depthMaskState)
                    gpu.depthMask(material.depthMask)
                if (material.cullFace !== cullFaceState) {
                    if (!material.cullFace)
                        gpu.disable(gpu.CULL_FACE)
                    else
                        gpu.enable(gpu.CULL_FACE)
                }
                cullFaceState = material.cullFace
                depthMaskState = material.depthMask
                const data = material.uniformValues, toBind = material.uniforms
                for (let j = 0; j < toBind.length; j++) {
                    const current = toBind[j]
                    const dataAttribute = data[current.key]
                    Shader.bind(uniforms[current.key], dataAttribute, current.type, texOffset, () => texOffset++)
                }
            } else {
                gpu.uniform1i(uniforms.noDepthChecking, 0)
                gpu.uniform1i(uniforms.materialID, -1)
                if (!depthMaskState) {
                    console.log("UPDATING STATE")
                    gpu.depthMask(true)
                    depthMaskState = true
                }
                if (!cullFaceState) {
                    console.log("UPDATING STATE")
                    gpu.enable(gpu.CULL_FACE)
                    cullFaceState = true
                }
            }
            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}