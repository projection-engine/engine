import Engine from "../../Engine";
import GPU from "../../lib/GPU";
import SSAO from "./SSAO";
import SSGI from "./SSGI";
import DirectionalShadows from "./DirectionalShadows";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityRenderer from "./VisibilityRenderer";
import Shader from "../../instances/Shader";
import CameraAPI from "../../lib/utils/CameraAPI";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import SHADING_MODELS from "../../static/SHADING_MODELS";
import UBO from "../../instances/UBO";
import COMPONENTS from "../../static/COMPONENTS";

let texOffset
let isDev
let shader, uniforms
export default class SceneRenderer {
    static #ready = false
    static debugShadingModel = SHADING_MODELS.DETAIL
    static UBO

    static initialize() {
        if (SceneRenderer.#ready)
            return
        isDev = Engine.developmentMode
        const FBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER)

        SceneRenderer.#ready = true
        SceneRenderer.UBO = new UBO(
            "UberShaderSettings",
            [
                {type: "float", name: "SSRFalloff"},
                {type: "float", name: "stepSizeSSR"},
                {type: "float", name: "maxSSSDistance"},
                {type: "float", name: "SSSDepthThickness"},
                {type: "float", name: "SSSEdgeAttenuation"},
                {type: "float", name: "skylightSamples"},
                {type: "float", name: "SSSDepthDelta"},
                {type: "float", name: "SSAOFalloff"},

                {type: "int", name: "maxStepsSSR"},
                {type: "int", name: "maxStepsSSS"},
                {type: "bool", name: "hasSkylight"},
                {type: "bool", name: "hasAmbientOcclusion"},
                {type: "vec2", name: "bufferResolution"},

            ])
        SceneRenderer.UBO.bind()
        SceneRenderer.UBO.updateData("bufferResolution", new Float32Array([FBO.width, FBO.height]))
        SceneRenderer.UBO.unbind()
    }

    static set shader(data) {
        shader = data
        uniforms = shader?.uniformMap
        window.lightPosition = new Float32Array([0,  10, 0])
        SceneRenderer.UBO.bindWithShader(shader.program)
    }

    static draw(useCustomView, viewProjection, viewMatrix, cameraPosition) {
        if (!SceneRenderer.#ready || !shader)
            return
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length

        shader.bind()
        if (isDev)
            gpu.uniform1i(uniforms.shadingModel, SceneRenderer.debugShadingModel)

        gpu.uniformMatrix4fv(uniforms.skyProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        if (!useCustomView) {

            gpu.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
            gpu.uniformMatrix4fv(uniforms.projectionMatrix, false, CameraAPI.projectionMatrix)
            gpu.uniformMatrix4fv(uniforms.invProjectionMatrix, false, CameraAPI.invProjectionMatrix)
            gpu.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
            gpu.uniform3fv(uniforms.cameraPosition, CameraAPI.position)
        } else {
            gpu.uniformMatrix4fv(uniforms.viewMatrix, false, viewMatrix)
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
        gpu.bindTexture(gpu.TEXTURE_2D, SSGI.sampler)
        gpu.uniform1i(uniforms.SSGI, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, DirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadow_atlas, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, OmnidirectionalShadows.sampler)
        gpu.uniform1i(uniforms.shadow_cube, 5)


        gpu.activeTexture(gpu.TEXTURE6)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityRenderer.depthSampler)
        gpu.uniform1i(uniforms.scene_depth, 6)

        gpu.uniform1f(uniforms.elapsedTime, Engine.elapsed)


        texOffset = 7

        // uniform samplerCube skylight_diffuse;
        // uniform samplerCube skylight_specular;
        // uniform float skylight_samples;

        if (GPU.__activeSkylightEntity !== null && !useCustomView) {
            texOffset++
            gpu.activeTexture(gpu.TEXTURE7)
            gpu.bindTexture(gpu.TEXTURE_CUBE_MAP, GPU.skylightProbe.texture)
            gpu.uniform1i(uniforms.skylight_specular, 7)
        }

        let stateWasCleared = false, isDoubleSided = false, isSky = false

        gpu.enable(gpu.CULL_FACE)
        gpu.depthMask(true)

        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const mesh = entity.__meshRef

            if (!entity.active || !mesh || entity.isCulled)
                continue

            if (isDev)
                gpu.uniform3fv(uniforms.entityID, entity.pickID)

            const material = entity.__materialRef

            if(isSky){
                isSky = false
                gpu.enable(gpu.CULL_FACE)
                gpu.enable(gpu.DEPTH_TEST)
            }

            if (material !== undefined) {
                if (material.doubleSided) {
                    gpu.disable(gpu.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    gpu.enable(gpu.CULL_FACE)
                    isDoubleSided = false
                }
                isSky = material.isSky
                gpu.uniform1i(uniforms.isSky, isSky ? 1 : 0)

                if(isSky) {
                    gpu.disable(gpu.CULL_FACE)
                    gpu.disable(gpu.DEPTH_TEST)
                }

                gpu.uniform1i(uniforms.noDepthChecking, material.isAlphaTested ? 1 : 0)
                gpu.uniform1i(uniforms.materialID, material.bindID)
                const component = entity.components.get(COMPONENTS.MESH)
                const overrideUniforms = component.overrideMaterialUniforms

                const data = overrideUniforms ? component.__mappedUniforms : material.uniformValues,
                    toBind = material.uniforms
                if (data)
                    for (let j = 0; j < toBind.length; j++) {
                        const current = toBind[j]
                        const dataAttribute = data[current.key]
                        Shader.bind(uniforms[current.key], dataAttribute, current.type, texOffset, () => texOffset++)
                    }

                gpu.uniform1i(uniforms.ssrEnabled, material.ssrEnabled ? 1 : 0)

                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    gpu.enable(gpu.CULL_FACE)
                    isDoubleSided = false
                }

                gpu.uniform1i(uniforms.ssrEnabled, 0)
                gpu.uniform1i(uniforms.noDepthChecking, 0)
                gpu.uniform1i(uniforms.materialID, -1)
            }



            if (useCustomView) {
                gpu.uniform1i(uniforms.noDepthChecking, 1)
                gpu.uniform1i(uniforms.ssrEnabled, 0)
            }

            gpu.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}