import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import StaticShaders from "../../lib/StaticShaders";
import StaticMeshes from "../../lib/StaticMeshes";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import UberShader from "../../utils/UberShader";

export default class DecalRenderer{
    static execute() {
        const context = GPU.context
        context.disable(context.CULL_FACE)
        context.disable(context.DEPTH_TEST)
        SceneRenderer.drawMeshes(false, true, context, ResourceEntityMapper.decals.array, UberShader.uberUniforms)
        MetricsController.currentState = METRICS_FLAGS.DECAL
        context.enable(context.DEPTH_TEST)
    }
}