import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import UberShader from "../../resource-libs/UberShader";

export default class DecalRenderer{
    static execute() {
        const context = GPU.context
        context.disable(context.CULL_FACE)
        context.disable(context.DEPTH_TEST)
        SceneRenderer.drawDecals()
        MetricsController.currentState = METRICS_FLAGS.DECAL
        context.enable(context.DEPTH_TEST)
    }
}