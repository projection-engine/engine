import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticShaders from "../lib/StaticShaders";
import type Entity from "../instances/Entity";
import EntityComponentMapping from "../lib/EntityComponentMapping";
import Shader from "../instances/Shader";
import Engine from "../Engine";
import CameraAPI from "../lib/utils/CameraAPI";
import StaticFBO from "../lib/StaticFBO";
import OmnidirectionalShadows from "./OmnidirectionalShadows";
import SceneComposition from "./SceneComposition";
import VisibilityRenderer from "./VisibilityRenderer";

let stateWasCleared = false, isDoubleSided = false, isSky = false, texOffset = 0
const materialAttributes = new Float32Array(9)
/** Material attributes
 * entityID[0] (0), entityID[1] (1), entityID[2] (2)
 * screenDoorEffect (3), isSky (4), noDepthChecking (5)
 * materialID (6), ssrEnabled (7), flatShading (8)
 */


export default class SceneRenderer {
    static #bindTexture(context: WebGL2RenderingContext, location: WebGLUniformLocation, index: number, sampler: WebGLTexture, cubeMap: boolean) {
        context.activeTexture(context.TEXTURE0 + index)
        context.bindTexture(cubeMap ? context.TEXTURE_CUBE_MAP : context.TEXTURE_2D, sampler)
        context.uniform1i(location, index)
    }

    static drawSprites() {
        const context = GPU.context
        const sprites = EntityComponentMapping.sprites.array
        const size = sprites.length
        if (size === 0)
            return

        const textures = GPU.textures

        StaticShaders.sprite.bind()
        const uniforms = StaticShaders.spriteUniforms

        context.activeTexture(context.TEXTURE0)
        for (let i = 0; i < size; i++) {
            const current = sprites[i], component = current.spriteComponent
            if (!current.active || current.isCulled)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue

            context.uniformMatrix4fv(uniforms.transformationMatrix, false, current.matrix)
            context.uniform3fv(uniforms.scale, current._scaling)
            context.uniform2fv(uniforms.attributes, component.attributes)
            context.bindTexture(context.TEXTURE_2D, texture.texture)
            context.uniform1i(uniforms.iconSampler, 0)
            StaticMeshes.drawQuad()
        }

    }

    static bindGlobalResources(context: WebGL2RenderingContext, uniforms: { [key: string]: WebGLUniformLocation }, useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        if (Engine.developmentMode)
            context.uniform1i(uniforms.shadingModel, SceneComposition.debugShadingModel)

        stateWasCleared = isDoubleSided = isSky = false
        texOffset = 7

        context.uniformMatrix4fv(uniforms.skyProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        context.uniform2fv(uniforms.bufferResolution, GPU.bufferResolution)
        context.uniform1f(uniforms.elapsedTime, Engine.elapsed)

        if (!useCustomView) {
            context.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
            context.uniformMatrix4fv(uniforms.projectionMatrix, false, CameraAPI.projectionMatrix)
            context.uniformMatrix4fv(uniforms.invProjectionMatrix, false, CameraAPI.invProjectionMatrix)
            context.uniformMatrix4fv(uniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
            context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
            context.uniform3fv(uniforms.cameraPosition, CameraAPI.position)

        } else {
            context.uniformMatrix4fv(uniforms.viewMatrix, false, viewMatrix)
            context.uniformMatrix4fv(uniforms.viewProjection, false, viewProjection)
            context.uniform3fv(uniforms.cameraPosition, cameraPosition)
        }

        SceneRenderer.#bindTexture(context, uniforms.brdf_sampler, 0, GPU.BRDF, false)
        SceneRenderer.#bindTexture(context, uniforms.SSAO, 1, StaticFBO.ssaoBlurredSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.SSGI, 2, StaticFBO.ssgiSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.previousFrame, 3, StaticFBO.lensSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.shadow_atlas, 4, StaticFBO.shadowsSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.scene_depth, 5, StaticFBO.visibilityDepthSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.shadow_cube, 6, OmnidirectionalShadows.sampler, true)

        if (!!GPU.activeSkylightEntity && !useCustomView) {
            texOffset++
            SceneRenderer.#bindTexture(context, uniforms.skylight_specular, 7, GPU.skylightProbe.texture, true)
        }

        // uniform samplerCube skylight_diffuse;
        // uniform samplerCube skylight_specular;
        // uniform float skylight_samples;

        context.enable(context.CULL_FACE)
    }

    static drawMeshes(onlyOpaque: boolean, isDecalPass: boolean, context: WebGL2RenderingContext, toRender: Entity[], uniforms: { [key: string]: WebGLUniformLocation }, useCustomView?: boolean) {
        materialAttributes[0] = materialAttributes[1] = materialAttributes[2] = materialAttributes[3] = materialAttributes[4] = materialAttributes[5] = materialAttributes[6] = materialAttributes[7] = materialAttributes[8] = 0
        const size = toRender.length
        const cube = StaticMeshes.cube
        context.uniform1i(uniforms.isDecalPass, isDecalPass ? 1 : 0)
        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const mesh = isDecalPass ? cube : entity.meshRef

            if (!entity.active || !mesh || entity.isCulled)
                continue
            materialAttributes[0] = entity.pickID[0]
            materialAttributes[1] = entity.pickID[1]
            materialAttributes[2] = entity.pickID[2]

            if (!isDecalPass) {
                const material = entity.materialRef
                materialAttributes[8] = 0
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
                    materialAttributes[8] = material.flatShading ? 1 : 0
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
                            if (current.type === "sampler2D")
                                Shader.bind(uniforms[current.key], dataAttribute.texture, current.type, texOffset, () => texOffset++)
                            else
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
            } else {
                const component = entity.decalComponent
                const albedoSampler = component.albedo?.texture
                const metallicSampler = component.metallic?.texture
                const roughnessSampler = component.roughness?.texture
                const normalSampler = component.normal?.texture
                const aoSampler = component.occlusion?.texture

                if (albedoSampler !== undefined)
                    SceneRenderer.#bindTexture(context, uniforms.sampler1, texOffset, albedoSampler, false)
                if (metallicSampler !== undefined)
                    SceneRenderer.#bindTexture(context, uniforms.sampler2, texOffset + 1, metallicSampler, false)
                if (roughnessSampler !== undefined)
                    SceneRenderer.#bindTexture(context, uniforms.sampler3, texOffset + 2, roughnessSampler, false)
                if (normalSampler !== undefined)
                    SceneRenderer.#bindTexture(context, uniforms.sampler4, texOffset + 3, normalSampler, false)
                if (aoSampler !== undefined)
                    SceneRenderer.#bindTexture(context, uniforms.sampler5, texOffset + 4, aoSampler, false)

                materialAttributes[4] = albedoSampler !== undefined ? 1 : 0
                materialAttributes[8] = metallicSampler !== undefined ? 1 : 0
                materialAttributes[5] = roughnessSampler !== undefined ? 1 : 0
                materialAttributes[3] = normalSampler !== undefined ? 1 : 0
                materialAttributes[6] = aoSampler !== undefined ? 1 : 0
                materialAttributes[7] = component.useSSR ? 1 : 0
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