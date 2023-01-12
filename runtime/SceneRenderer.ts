import GPU from "../GPU";
import DynamicMap from "../templates/DynamicMap";
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
import UberShader from "../utils/UberShader";

let stateWasCleared = false, isDoubleSided = false, isSky = false, texOffset = 0
const materialAttributes = new Float32Array(9)
/** Material attributes
 * entityID[0] (0), entityID[1] (1), entityID[2] (2)
 * screenDoorEffect (3), isSky (4), noDepthChecking (5)
 * materialID (6) | alwaysFaceCamera, ssrEnabled (7) | keepSameSize, flatShading (8)
 */

export default class SceneRenderer {
    static drawSprites() {
        const sprites = EntityComponentMapping.sprites.array
        const size = sprites.length
        if (size === 0)
            return

        const textures = GPU.textures
        GPU.context.disable(GPU.context.CULL_FACE)
        StaticShaders.sprite.bind()
        const uniforms = StaticShaders.spriteUniforms

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        for (let i = 0; i < size; i++) {
            const current = sprites[i], component = current.spriteComponent
            if (!current.active || current.isCulled)
                continue
            const texture = textures.get(component.imageID)
            if (!texture)
                continue

            GPU.context.uniformMatrix4fv(uniforms.transformationMatrix, false, current.matrix)
            GPU.context.uniform3fv(uniforms.scale, current._scaling)
            GPU.context.uniform2fv(uniforms.attributes, component.attributes)
            GPU.context.bindTexture(GPU.context.TEXTURE_2D, texture.texture)
            GPU.context.uniform1i(uniforms.iconSampler, 0)
            StaticMeshes.drawQuad()
        }

        GPU.context.enable(GPU.context.CULL_FACE)
    }

    static bindGlobalResources(context: WebGL2RenderingContext, uniforms: { [key: string]: WebGLUniformLocation }, useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        if (Engine.developmentMode)
            context.uniform1i(uniforms.shadingModel, SceneComposition.debugShadingModel)

        stateWasCleared = isDoubleSided = isSky = false

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
        context.bindTexture(context.TEXTURE_2D, StaticFBO.ssgiSampler)
        context.uniform1i(uniforms.SSGI, 2)

        context.activeTexture(context.TEXTURE3)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.lensSampler)
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

        context.enable(context.CULL_FACE)
    }

    static drawMeshes(isSpritePass: boolean, context: WebGL2RenderingContext, toRender: Entity[], uniforms: { [key: string]: WebGLUniformLocation }, useCustomView?: boolean) {
        const size = toRender.length
        if (isSpritePass) {
            materialAttributes[0] = materialAttributes[1] = materialAttributes[2] = materialAttributes[3] = materialAttributes[4] = materialAttributes[5] = materialAttributes[6] = materialAttributes[7] = materialAttributes[8] = 0
            context.disable(context.CULL_FACE)
        }
        context.uniform1i(uniforms.isSpritePass, isSpritePass ? 1 : 0)
        for (let i = 0; i < size; i++) {
            const entity = toRender[i]
            const mesh = entity.meshRef

            if (!entity.active || entity.isCulled)
                continue

            materialAttributes[0] = entity.pickID[0]
            materialAttributes[1] = entity.pickID[1]
            materialAttributes[2] = entity.pickID[2]

            if (!isSpritePass) {
                if (!mesh)
                    continue
                const material = entity.materialRef
                materialAttributes[8] = 0
                if (isSky) {
                    isSky = false
                    context.enable(context.CULL_FACE)
                    context.enable(context.DEPTH_TEST)
                }
                const culling = entity?.cullingComponent
                materialAttributes[3] = culling && culling.screenDoorEffect ? entity.__cullingMetadata[5] : 0
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
            } else {
                const sprite = entity.spriteComponent
                const texture = GPU.textures.get(sprite.imageID)
                if (!texture)
                    continue
                if (useCustomView)
                    materialAttributes[5] = 1

                materialAttributes[6] = sprite.attributes[0]
                materialAttributes[7] = sprite.attributes[1]
                materialAttributes[8] = sprite.attributes[2]
                context.uniform3fv(uniforms.scale, entity.scaling)
                context.activeTexture(context.TEXTURE0 + texOffset)
                console.log(texture.texture)
                context.bindTexture(context.TEXTURE_2D, texture.texture)
                context.uniform1i(uniforms.sampler1, texOffset)
            }


            context.uniformMatrix3fv(uniforms.materialAttributes, false, materialAttributes)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)
            if(isSpritePass)
                StaticMeshes.plane.draw()
            else
                mesh.draw()
        }
    }
}