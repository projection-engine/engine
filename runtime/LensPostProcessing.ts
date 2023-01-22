import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import Bloom from "./Bloom";
import Bokeh from "./Bokeh";
import MotionBlur from "./MotionBlur";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";


export default class LensPostProcessing {

    static execute() {
        MetricsController.currentState = METRICS_FLAGS.LENS
        const context = GPU.context

        Bokeh.execute()
        MotionBlur.execute()
        Bloom.execute()

        StaticFBO.lens.startMapping()
        StaticShaders.lens.bind()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing2Sampler)
        context.uniform1i(StaticShaders.lensUniforms.bloomColor, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing1Sampler)
        context.uniform1i(StaticShaders.lensUniforms.sceneColor, 1)

        StaticMeshes.drawQuad()
        StaticFBO.lens.stopMapping()
    }

}