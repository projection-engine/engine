import Engine from "../Engine";
import GPU from "../GPU";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityRenderer from "./VisibilityRenderer";
import Shader from "../instances/Shader";
import CameraAPI from "../lib/utils/CameraAPI";
import SHADING_MODELS from "../static/SHADING_MODELS";
import UBO from "../instances/UBO";
import COMPONENTS from "../static/COMPONENTS";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";

let texOffset

export default class SceneRenderer {
    static #ready = false
    static debugShadingModel = SHADING_MODELS.DETAIL
    static UBO

    static initialize() {
        if (SceneRenderer.#ready)
            return
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
        SceneRenderer.UBO.updateData("bufferResolution", new Float32Array([GPU.internalResolution.w, GPU.internalResolution.h]))
        SceneRenderer.UBO.unbind()
    }


    static execute(useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        const shader = StaticShaders.uber
        if (!SceneRenderer.#ready || !shader)
            return

        const uniforms = StaticShaders.uberUniforms
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        const context = GPU.context

        shader.bind()

        if (Engine.developmentMode)
            context.uniform1i(uniforms.shadingModel, SceneRenderer.debugShadingModel)

        context.uniformMatrix4fv(uniforms.skyProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        if (!useCustomView) {
            context.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
            context.uniformMatrix4fv(uniforms.projectionMatrix, false, CameraAPI.projectionMatrix)
            context.uniformMatrix4fv(uniforms.invProjectionMatrix, false, CameraAPI.invProjectionMatrix)
            context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
            context.uniform3fv(uniforms.cameraPosition, CameraAPI.position)
        } else {
            context.uniformMatrix4fv(uniforms.viewMatrix, false, viewMatrix)
            context.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
            context.uniform3fv(uniforms.cameraPosition, cameraPosition)
        }

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, GPU.BRDF)
        context.uniform1i(uniforms.brdf_sampler, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.ssaoBlurredSampler)
        context.uniform1i(uniforms.SSAO, 1)

        context.activeTexture(context.TEXTURE2)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.ssgiFinalSampler)
        context.uniform1i(uniforms.SSGI, 2)

        context.activeTexture(context.TEXTURE3)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.cacheSampler)
        context.uniform1i(uniforms.previousFrame, 3)

        context.activeTexture(context.TEXTURE4)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.shadowsSampler)
        context.uniform1i(uniforms.shadow_atlas, 4)

        context.activeTexture(context.TEXTURE5)
        context.bindTexture(context.TEXTURE_CUBE_MAP, OmnidirectionalShadows.sampler)
        context.uniform1i(uniforms.shadow_cube, 5)


        context.activeTexture(context.TEXTURE6)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.visibilityDepthSampler)
        context.uniform1i(uniforms.scene_depth, 6)

        context.uniform1f(uniforms.elapsedTime, Engine.elapsed)


        texOffset = 7

        // uniform samplerCube skylight_diffuse;
        // uniform samplerCube skylight_specular;
        // uniform float skylight_samples;

        if (!!GPU.activeSkylightEntity && !useCustomView) {
            texOffset++
            context.activeTexture(context.TEXTURE7)
            context.bindTexture(context.TEXTURE_CUBE_MAP, GPU.skylightProbe.texture)
            context.uniform1i(uniforms.skylight_specular, 7)
        }

        let stateWasCleared = false, isDoubleSided = false, isSky = false

        context.enable(context.CULL_FACE)
        context.depthMask(true)

        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const mesh = entity.__meshRef

            if (!entity.active || !mesh || entity.isCulled)
                continue

            if ( Engine.developmentMode)
                context.uniform3fv(uniforms.entityID, entity.pickID)

            const material = entity.__materialRef

            if (isSky) {
                isSky = false
                context.enable(context.CULL_FACE)
                context.enable(context.DEPTH_TEST)
            }

            if (material !== undefined) {
                if (material.doubleSided) {
                    context.disable(context.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }
                isSky = material.isSky
                context.uniform1i(uniforms.isSky, isSky ? 1 : 0)

                if (isSky) {
                    context.disable(context.CULL_FACE)
                    context.disable(context.DEPTH_TEST)
                }

                context.uniform1i(uniforms.noDepthChecking, material.isAlphaTested ? 1 : 0)
                context.uniform1i(uniforms.materialID, material.bindID)
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

                context.uniform1i(uniforms.ssrEnabled, material.ssrEnabled ? 1 : 0)

                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }

                context.uniform1i(uniforms.ssrEnabled, 0)
                context.uniform1i(uniforms.noDepthChecking, 0)
                context.uniform1i(uniforms.materialID, -1)
            }


            if (useCustomView) {
                context.uniform1i(uniforms.noDepthChecking, 1)
                context.uniform1i(uniforms.ssrEnabled, 0)
            }

            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}