import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import UberShader from "../../resource-libs/UberShader";
import Loop from "../../Loop";
import StaticFBO from "../../lib/StaticFBO";
import SceneComposition from "../SceneComposition";

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