import GPU from "../GPU";
import SHADING_MODELS from "../static/SHADING_MODELS";
import StaticFBO from "../lib/StaticFBO";
import UberShader from "../utils/UberShader";
import ResourceEntityMapper from "../lib/ResourceEntityMapper";
import SceneRenderer from "./SceneRenderer";
import Loop from "../Loop";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";


export default class SceneComposition {
    static debugShadingModel = SHADING_MODELS.DETAIL
    static MAX_TRANSLUCENCY = 1000
    static transparencyIndexes = new Uint8Array(SceneComposition.MAX_TRANSLUCENCY)
    static transparenciesToLoopThrough = 0

    static execute() {

        const shader = UberShader.uber
        if (!shader)
            return

        shader.bind()
        const uniforms = UberShader.uberUniforms
        const context = GPU.context
        const meshes = ResourceEntityMapper.meshesToDraw.array

        SceneRenderer.bindGlobalResources(context, uniforms)
        SceneComposition.transparenciesToLoopThrough = 0
        StaticFBO.postProcessing2.startMapping()
        MetricsController.currentState = METRICS_FLAGS.OPAQUE
        SceneRenderer.drawMeshes(true, false, context, meshes, uniforms)
        context.disable(context.CULL_FACE)
        context.disable(context.DEPTH_TEST)
        MetricsController.currentState = METRICS_FLAGS.DECAL
        SceneRenderer.drawMeshes(false, true, context, ResourceEntityMapper.decals.array, uniforms)
        context.enable(context.DEPTH_TEST)
        MetricsController.currentState = METRICS_FLAGS.SPRITE
        SceneRenderer.drawSprites()
        context.enable(context.CULL_FACE)
        StaticFBO.postProcessing2.stopMapping()

        if (SceneComposition.transparenciesToLoopThrough > 0) {
            MetricsController.currentState = METRICS_FLAGS.TRANSPARENCY
            Loop.copyToCurrentFrame()

            StaticFBO.postProcessing2.use()
            SceneRenderer.drawMeshes(false, false, context, meshes, uniforms)
            StaticFBO.postProcessing2.stopMapping()
        }

    }

}