import GPU from "../GPU";
import GPUAPI from "../lib/rendering/GPUAPI";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";


export default class Bokeh {

    static execute() {
        StaticShaders.bokeh.bind()
        StaticFBO.bokeh.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.currentFrameSampler)
        GPU.context.uniform1i(StaticShaders.bokehUniforms.sceneColor, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.visibilityDepthSampler)
        GPU.context.uniform1i(StaticShaders.bokehUniforms.depthSampler, 1)

        GPU.context.uniform1f(StaticShaders.bokehUniforms.radius, .5)

        StaticMeshes.drawQuad()
        StaticFBO.bokeh.stopMapping()
        GPUAPI.copyTexture(StaticFBO.cache, StaticFBO.bokeh, GPU.context.COLOR_BUFFER_BIT, GPU.context.LINEAR)
    }
}
