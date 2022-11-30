import Engine from "../../Engine";
import GPU from "../../GPU";
import SSAO from "./SSAO";
import SSGI from "./SSGI";
import DirectionalShadows from "./DirectionalShadows";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityBuffer from "./VisibilityBuffer";
import Shader from "../../instances/Shader";
import CameraAPI from "../../lib/utils/CameraAPI";
import SSR from "./SSR";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import SHADING_MODELS from "../../static/SHADING_MODELS";
import COMPONENTS from "../../static/COMPONENTS";

let texOffset, bufferResolution
let isDev
let shader, uniforms
export default class SceneRenderer {
    static #ready = false
    static debugShadingModel = SHADING_MODELS.DETAIL
    static set shader(data) {
        shader = data
        uniforms = shader?.uniformMap
    }

    static initialize() {
        isDev = Engine.developmentMode
        const FBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)
        bufferResolution = new Float32Array([FBO.width, FBO.height])
        SceneRenderer.#ready = true
    }

    static draw(useCustomView, viewProjection, cameraPosition) {
        if (useCustomView)
            console.log(viewProjection, cameraPosition, GPU.skylightProbe)
        if (!SceneRenderer.#ready || !shader)
            return
        const entities = Engine.data.meshes
        const size = entities.length

        shader.bind()
        if(isDev)
            gpu.uniform1i(uniforms.shadingModel, SceneRenderer.debugShadingModel)
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
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthSampler)
        gpu.uniform1i(uniforms.scene_depth, 6)

        gpu.uniform1i(uniforms.hasAmbientOcclusion, SSAO.enabled ? 1 : 0)
        gpu.uniform1f(uniforms.elapsedTime, Engine.elapsed)
        gpu.uniform2fv(uniforms.buffer_resolution, bufferResolution)
        texOffset = 7

        // uniform samplerCube skylight_diffuse;
        // uniform samplerCube skylight_specular;
        // uniform float skylight_samples;

        if (GPU.__activeSkylightEntity !== null && !useCustomView) {
            gpu.uniform1i(uniforms.hasSkylight, 1)
            texOffset++
            gpu.activeTexture(gpu.TEXTURE7)
            gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, GPU.skylightProbe.texture)
            gpu.uniform1i(uniforms.skylight_specular, 7)
        }

        let depthMaskState = true, cullFaceState = true

        gpu.enable(gpu.CULL_FACE)
        gpu.cullFace(gpu.BACK)

        gpu.depthMask(true)

        for (let i = 0; i < size; i++) {

            const entity = entities[i]
            const mesh = entity.__meshRef

            if (!entity.active || !mesh)
                continue

            if (isDev)
                gpu.uniform3fv(uniforms.entityID, entity.pickID)
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

                const component = entity.components.get(COMPONENTS.MESH)
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
            if (useCustomView)
                gpu.uniform1i(uniforms.noDepthChecking, 1)

            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}