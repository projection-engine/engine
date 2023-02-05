import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import Loop from "../../Loop";
import StaticFBO from "../../lib/StaticFBO";

export default class MeshRenderer {
    static execute(transparencyOnly: boolean) {
        if (!transparencyOnly) {
            SceneRenderer.drawOpaque()
            MetricsController.currentState = METRICS_FLAGS.OPAQUE
            return
        }
        Loop.copyToCurrentFrame()
        StaticFBO.postProcessing2.use()
        SceneRenderer.drawTransparency()
        StaticFBO.postProcessing2.stopMapping()
        MetricsController.currentState = METRICS_FLAGS.TRANSPARENCY
    }
}