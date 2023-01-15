import GPU from "../GPU";
import SHADING_MODELS from "../static/SHADING_MODELS";
import StaticFBO from "../lib/StaticFBO";
import UberShader from "../utils/UberShader";
import EntityComponentMapping from "../lib/EntityComponentMapping";
import SceneRenderer from "./SceneRenderer";


export default class SceneComposition {
    static debugShadingModel = SHADING_MODELS.DETAIL

    static execute(useCustomView?: boolean, viewProjection?: Float32Array, viewMatrix?: Float32Array, cameraPosition?: Float32Array) {
        const shader = UberShader.uber
        if (!shader)
            return

        shader.bind()
        const uniforms = UberShader.uberUniforms
        const context = GPU.context

        SceneRenderer.bindGlobalResources(context, uniforms, useCustomView, viewProjection, viewMatrix, cameraPosition)

        StaticFBO.postProcessing2.startMapping()

        SceneRenderer.drawMeshes(true, false, context, EntityComponentMapping.meshesToDraw.array, uniforms, useCustomView)
        context.disable(context.CULL_FACE)
        context.disable(context.DEPTH_TEST)
        SceneRenderer.drawMeshes(true, true, context, EntityComponentMapping.decals.array, uniforms, useCustomView)
        context.enable(context.DEPTH_TEST)
        SceneRenderer.drawSprites()
        context.enable(context.CULL_FACE)

        StaticFBO.postProcessing2.stopMapping()
    }

}