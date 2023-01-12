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
        const toRender = EntityComponentMapping.meshesToDraw.array
        const size = toRender.length
        const context = GPU.context

        SceneRenderer.bindGlobalResources(context, uniforms, useCustomView, viewProjection, viewMatrix, cameraPosition)

        StaticFBO.postProcessing2.startMapping()

        SceneRenderer.drawMeshes(true, context, size, toRender, uniforms, useCustomView)
        SceneRenderer.drawSprites()

        StaticFBO.postProcessing2.stopMapping()
    }

}