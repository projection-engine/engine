import GPU from "../GPU";
import GPUAPI from "../lib/rendering/GPUAPI";
import StaticMeshesController from "../lib/StaticMeshesController";
import StaticFBOsController from "../lib/StaticFBOsController";
import StaticShadersController from "../lib/StaticShadersController";


export default class Bokeh {

    static execute() {
        StaticShadersController.bokeh.bind()
        StaticFBOsController.bokeh.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.currentFrameSampler)
        GPU.context.uniform1i(StaticShadersController.bokehUniforms.sceneColor, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.visibilityDepthSampler)
        GPU.context.uniform1i(StaticShadersController.bokehUniforms.depthSampler, 1)

        GPU.context.uniform1f(StaticShadersController.bokehUniforms.radius, .5)

        StaticMeshesController.drawQuad()
        StaticFBOsController.bokeh.stopMapping()
        GPUAPI.copyTexture(StaticFBOsController.cache, StaticFBOsController.bokeh, GPU.context.COLOR_BUFFER_BIT, GPU.context.LINEAR)
    }
}
