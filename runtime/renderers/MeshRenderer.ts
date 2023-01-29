import GPU from "../../GPU";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";
import StaticShaders from "../../lib/StaticShaders";
import StaticMeshes from "../../lib/StaticMeshes";
import MetricsController from "../../lib/utils/MetricsController";
import METRICS_FLAGS from "../../static/METRICS_FLAGS";
import SceneRenderer from "./SceneRenderer";
import UberShader from "../../resource-libs/UberShader";
import Loop from "../../Loop";
import StaticFBO from "../../lib/StaticFBO";
import SceneComposition from "../SceneComposition";

export default class MeshRenderer {
    static execute(transparencyOnly: boolean) {
        const uniforms = UberShader.uberUniforms
        const context = GPU.context
        const meshes = ResourceEntityMapper.meshesToDraw.array
        if (!transparencyOnly) {
            SceneComposition.transparenciesToLoopThrough = 0
            SceneRenderer.drawMeshes(true, false, context, meshes, uniforms)
            MetricsController.currentState = METRICS_FLAGS.OPAQUE
        } else if (SceneComposition.transparenciesToLoopThrough > 0) {
            Loop.copyToCurrentFrame()

            StaticFBO.postProcessing2.use()
            SceneRenderer.drawMeshes(false, false, context, meshes, uniforms)
            StaticFBO.postProcessing2.stopMapping()

            MetricsController.currentState = METRICS_FLAGS.TRANSPARENCY
        }
    }
}