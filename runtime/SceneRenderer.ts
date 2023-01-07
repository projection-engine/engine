import Engine from "../Engine";
import GPU from "../GPU";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import VisibilityRenderer from "./VisibilityRenderer";
import Shader from "../instances/Shader";
import CameraAPI from "../lib/utils/CameraAPI";
import SHADING_MODELS from "../static/SHADING_MODELS";
import StaticFBO from "../lib/StaticFBO";
import UberShader from "../utils/UberShader";

let texOffset

const materialAttributes = new Float32Array(9)

/** Material attributes
 * entityID[0] (0), entityID[1] (1), entityID[2] (2)
 * screenDoorEffect (3), isSky (4), noDepthChecking (5)
 * materialID (6), ssrEnabled (7)
 */

export default class SceneRenderer {
    static debugShadingModel = SHADING_MODELS.DETAIL

    static execute(useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        const shader = UberShader.uber
        if ( !shader)
            return

        const uniforms = UberShader.uberUniforms
        const toRender = VisibilityRenderer.meshesToDraw.array
        const size = toRender.length
        const context = GPU.context
        shader.bind()
        if (Engine.developmentMode)
            context.uniform1i(uniforms.shadingModel, SceneRenderer.debugShadingModel)

        context.uniformMatrix4fv(uniforms.skyProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        context.uniform2fv(uniforms.bufferResolution, GPU.bufferResolution)

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
        context.bindTexture(context.TEXTURE_2D, StaticFBO.currentFrameSampler)
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
            const mesh = entity.meshRef

            if (!entity.active || !mesh || entity.isCulled)
                continue
            materialAttributes[0] = entity.pickID[0]
            materialAttributes[1] = entity.pickID[1]
            materialAttributes[2] = entity.pickID[2]

            const material = entity.materialRef

            if (isSky) {
                isSky = false
                context.enable(context.CULL_FACE)
                context.enable(context.DEPTH_TEST)
            }

            const culling = entity?.cullingComponent

            if (culling && culling.screenDoorEffect) {
                materialAttributes[3] = entity.__cullingMetadata[5]
            } else
                materialAttributes[3] = 0

            if (material !== undefined) {
                if (material.doubleSided) {
                    context.disable(context.CULL_FACE)
                    isDoubleSided = true
                } else if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }
                isSky = material.isSky

                materialAttributes[4] = isSky ? 1 : 0

                if (isSky) {
                    context.disable(context.CULL_FACE)
                    context.disable(context.DEPTH_TEST)
                }


                materialAttributes[5] = material.isAlphaTested ? 1 : 0
                materialAttributes[6] = material.bindID

                const component = entity.meshComponent
                const overrideUniforms = component.overrideMaterialUniforms
                const data = overrideUniforms ? component.__mappedUniforms : material.uniformValues
                const toBind = material.uniforms
                if (data)
                    for (let j = 0; j < toBind.length; j++) {
                        const current = toBind[j]
                        const dataAttribute = data[current.key]
                        Shader.bind(uniforms[current.key], dataAttribute, current.type, texOffset, () => texOffset++)
                    }

                materialAttributes[7] = material.ssrEnabled ? 1 : 0

                stateWasCleared = false
            } else if (!stateWasCleared) {
                stateWasCleared = true
                if (isDoubleSided) {
                    context.enable(context.CULL_FACE)
                    isDoubleSided = false
                }

                materialAttributes[7] = 0
                materialAttributes[5] = 0
                materialAttributes[6] = -1
            }


            if (useCustomView) {
                materialAttributes[5] = 1
                materialAttributes[7] = 0
            }


            context.uniformMatrix3fv(uniforms.materialAttributes, false, materialAttributes)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            mesh.draw()
        }
    }

}