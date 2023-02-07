import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import CameraAPI from "../lib/utils/CameraAPI";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";


export default class Bokeh {
    static execute() {

        if(!CameraAPI.DOF)
            return

        StaticShaders.bokeh.bind()
        StaticFBO.postProcessing2.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.postProcessing1Sampler)
        GPU.context.uniform1i(StaticShaders.bokehUniforms.sceneColor, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.sceneDepthVelocity)
        GPU.context.uniform1i(StaticShaders.bokehUniforms.sceneDepth, 1)

        StaticMeshes.drawQuad()
        StaticFBO.postProcessing2.stopMapping()
        MetricsController.currentState = METRICS_FLAGS.BOKEH
    }
}
