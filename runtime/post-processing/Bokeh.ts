import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import GPUAPI from "../../lib/rendering/GPUAPI";
import Engine from "../../Engine";
import VisibilityRenderer from "../rendering/VisibilityRenderer";

let FBO, shader, uniforms, T
export default class Bokeh {
    static initialize() {
        FBO = GPUAPI.allocateFramebuffer("TESTE").texture()
        T = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CHACHE_BUFFER)
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BOKEH)
        uniforms = shader.uniformMap
        console.log(shader, uniforms)
    }
    static execute() {
        shader.bind()
        FBO.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, Engine.previousFrameSampler)
        GPU.context.uniform1i(uniforms.sceneColor, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, VisibilityRenderer.depthSampler)
        GPU.context.uniform1i(uniforms.depthSampler, 1)

        GPU.context.uniform1f(uniforms.radius, .5)

        GPU.drawQuad()
        FBO.stopMapping()
        GPUAPI.copyTexture(T, FBO, GPU.context.COLOR_BUFFER_BIT, GPU.context.LINEAR)
    }
}
