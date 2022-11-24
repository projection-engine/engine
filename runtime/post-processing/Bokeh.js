
import GPU from "../../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import GPUAPI from "../../lib/rendering/GPUAPI";
import Engine from "../../Engine";
import VisibilityBuffer from "../rendering/VisibilityBuffer";

let FBO, shader, uniforms, T
export default class Bokeh {
    static initialize() {
        FBO = GPUAPI.allocateFramebuffer("TESTE").texture()
        T = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER)
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BOKEH)
        uniforms = shader.uniformMap
        console.log(shader, uniforms)
    }
    static execute() {
        shader.bind()
        FBO.startMapping()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.sceneColor, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthEntityIDSampler)
        gpu.uniform1i(uniforms.depthSampler, 1)

        gpu.uniform1f(uniforms.radius, window.d||.5)

        drawQuad()
        FBO.stopMapping()
        GPUAPI.copyTexture(T, FBO, gpu.COLOR_BUFFER_BIT, gpu.LINEAR)
    }
}
