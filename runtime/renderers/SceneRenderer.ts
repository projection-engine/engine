import GPU from "../../GPU";
import StaticMeshes from "../../lib/StaticMeshes";
import type Entity from "../../instances/Entity";
import Shader from "../../instances/Shader";
import Engine from "../../Engine";
import CameraAPI from "../../lib/utils/CameraAPI";
import StaticFBO from "../../lib/StaticFBO";
import OmnidirectionalShadows from "../OmnidirectionalShadows";
import SceneComposition from "../SceneComposition";
import UberMaterialAttributeGroup from "../../resource-libs/UberMaterialAttributeGroup";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import Material from "../../instances/Material";
import UberShader from "../../resource-libs/UberShader";

let stateWasCleared = false, isDoubleSided = false, isSky = false, texOffset = 0

export default class SceneRenderer {
    static #bindTexture(context: WebGL2RenderingContext, location: WebGLUniformLocation, index: number, sampler: WebGLTexture, cubeMap: boolean) {
        context.activeTexture(context.TEXTURE0 + index)
        context.bindTexture(cubeMap ? context.TEXTURE_CUBE_MAP : context.TEXTURE_2D, sampler)
        context.uniform1i(location, index)
    }


    static bindGlobalResources( viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        const uniforms = UberShader.uberUniforms
        const context = GPU.context

        UberShader.uber.bind()
        if (Engine.developmentMode)
            context.uniform1i(uniforms.shadingModel, SceneComposition.debugShadingModel)

        stateWasCleared = isDoubleSided = isSky = false
        texOffset = 7

        context.uniformMatrix4fv(uniforms.skyProjectionMatrix, false, CameraAPI.skyboxProjectionMatrix)
        context.uniform1f(uniforms.elapsedTime, Engine.elapsed)
        context.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
        context.uniformMatrix4fv(uniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
        context.uniformMatrix4fv(uniforms.viewProjection, false, CameraAPI.viewProjectionMatrix)
        context.uniform3fv(uniforms.cameraPosition, CameraAPI.position)

        SceneRenderer.#bindTexture(context, uniforms.brdf_sampler, 0, GPU.BRDF, false)
        SceneRenderer.#bindTexture(context, uniforms.SSAO, 1, StaticFBO.ssaoBlurredSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.SSGI, 2, StaticFBO.ssgiSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.sceneDepth, 3, StaticFBO.sceneDepth, false)

        SceneRenderer.#bindTexture(context, uniforms.previousFrame, 4, StaticFBO.lensSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.shadow_atlas, 5, StaticFBO.shadowsSampler, false)
        SceneRenderer.#bindTexture(context, uniforms.shadow_cube, 6, OmnidirectionalShadows.sampler, true)

        // if (!!GPU.activeSkylightEntity) {
        //     texOffset++
        //     SceneRenderer.#bindTexture(context, uniforms.skylight_specular, 7, GPU.skylightProbe.texture, true)
        // }

        // uniform samplerCube skylight_diffuse;
        // uniform samplerCube skylight_specular;
        // uniform float skylight_samples;

        context.enable(context.CULL_FACE)
    }

    static #bindComponentUniforms(entity: Entity, material: Material, uniforms: { [key: string]: WebGLUniformLocation }) {
        const component = entity.meshComponent
        const overrideUniforms = component.overrideMaterialUniforms
        const data = overrideUniforms ? component.__mappedUniforms : material.uniformValues
        const toBind = material.uniforms
        if (data)
            for (let j = 0; j < toBind.length; j++) {
                const current = toBind[j]
                const dataAttribute = data[current.key]
                if(!dataAttribute)
                    continue
                if (current.type === "sampler2D")
                    Shader.bind(uniforms[current.key], dataAttribute.texture, current.type, texOffset, () => texOffset++)
                else
                    Shader.bind(uniforms[current.key], dataAttribute, current.type, texOffset, () => texOffset++)
            }
    }

    static #drawOpaque(uniforms: { [key: string]: WebGLUniformLocation }, context: WebGL2RenderingContext, entity: Entity) {
        const material = entity.materialRef

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
            isSky = material.renderingMode === MATERIAL_RENDERING_TYPES.SKY

            if (isSky) {
                context.disable(context.CULL_FACE)
                context.disable(context.DEPTH_TEST)
            }
            UberMaterialAttributeGroup.materialID = material.bindID
            UberMaterialAttributeGroup.renderingMode = material.renderingMode
            UberMaterialAttributeGroup.ssrEnabled = material.ssrEnabled ? 1 : 0

            SceneRenderer.#bindComponentUniforms(entity, material, uniforms)


            stateWasCleared = false
        } else if (!stateWasCleared) {
            stateWasCleared = true
            if (isDoubleSided) {
                context.enable(context.CULL_FACE)
                isDoubleSided = false
            }

            UberMaterialAttributeGroup.ssrEnabled = 0
            UberMaterialAttributeGroup.renderingMode = MATERIAL_RENDERING_TYPES.ISOTROPIC
            UberMaterialAttributeGroup.materialID = -1
        }
    }

    static #drawDecal(uniforms, context, entity) {

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

        UberMaterialAttributeGroup.useAlbedoDecal = albedoSampler !== undefined ? 1 : 0
        UberMaterialAttributeGroup.useMetallicDecal = metallicSampler !== undefined ? 1 : 0
        UberMaterialAttributeGroup.useRoughnessDecal = roughnessSampler !== undefined ? 1 : 0
        UberMaterialAttributeGroup.useNormalDecal = normalSampler !== undefined ? 1 : 0
        UberMaterialAttributeGroup.useOcclusionDecal = aoSampler !== undefined ? 1 : 0
        UberMaterialAttributeGroup.ssrEnabled = component.useSSR ? 1 : 0

        UberMaterialAttributeGroup.renderingMode = component.renderingMode
        UberMaterialAttributeGroup.anisotropicRotation = component.anisotropicRotation
        UberMaterialAttributeGroup.anisotropy = component.anisotropy
        UberMaterialAttributeGroup.clearCoat = component.clearCoat
        UberMaterialAttributeGroup.sheen = component.sheen
        UberMaterialAttributeGroup.sheenTint = component.sheenTint

    }


    static drawMeshes(onlyOpaque: boolean, isDecalPass: boolean, context: WebGL2RenderingContext, toRender: Entity[], uniforms: { [key: string]: WebGLUniformLocation }) {
        UberMaterialAttributeGroup.clear()
        const isTransparencyPass = !isDecalPass && !onlyOpaque
        const size = isTransparencyPass ? SceneComposition.transparenciesToLoopThrough : toRender.length
        const cube = StaticMeshes.cube

        context.uniform1i(uniforms.isDecalPass, isDecalPass ? 1 : 0)

        if (isTransparencyPass)
            SceneRenderer.#bindTexture(context, uniforms.previousFrame, 3, StaticFBO.postProcessing1Sampler, false)

        for (let i = 0; i < size; i++) {
            const entity = isTransparencyPass ? toRender[SceneComposition.transparencyIndexes[i]] : toRender[i]
            const mesh = isDecalPass ? cube : entity.meshRef

            if (!entity.active || !mesh || entity.isCulled)
                continue

            const culling = entity?.cullingComponent
            UberMaterialAttributeGroup.screenDoorEffect = culling && culling.screenDoorEffect ? entity.__cullingMetadata[5] : 0
            UberMaterialAttributeGroup.entityID = entity.pickID

            if (isTransparencyPass) {
                const material = entity.materialRef

                UberMaterialAttributeGroup.materialID = material.bindID
                UberMaterialAttributeGroup.renderingMode = material.renderingMode
                UberMaterialAttributeGroup.ssrEnabled = material.ssrEnabled ? 1 : 0

                SceneRenderer.#bindComponentUniforms(entity, material, uniforms)
            } else if (isDecalPass)
                SceneRenderer.#drawDecal(uniforms, context, entity)
            else {
                if (entity.materialRef?.renderingMode === MATERIAL_RENDERING_TYPES.TRANSPARENCY) {
                    SceneComposition.transparencyIndexes[SceneComposition.transparenciesToLoopThrough] = i
                    SceneComposition.transparenciesToLoopThrough++
                    continue
                }
                SceneRenderer.#drawOpaque(uniforms, context, entity)
            }


            context.uniformMatrix4fv(uniforms.materialAttributes, false, UberMaterialAttributeGroup.data)
            context.uniformMatrix4fv(uniforms.modelMatrix, false, entity.matrix)

            mesh.draw()
        }
    }
}