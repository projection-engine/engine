import GPU from "../../GPU";
import Engine from "../../Engine";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import VisibilityBuffer from "./VisibilityBuffer";
import FrameComposition from "../post-processing/FrameComposition";

let shader, uniforms
let framebuffer
export default class SSR {
    static SSRSampler
    static enabled = true
    static rayMarchSettings = new Float32Array(4)


    static initialize() {
        framebuffer = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.SSR)
        SSR.SSRSampler = framebuffer.colors[0]
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SSR)
        uniforms = shader.uniformMap
    }

    static execute() {
        if (!SSR.enabled) {
            framebuffer.clear()
            return
        }

        framebuffer.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthSampler)
        gpu.uniform1i(uniforms.depthSampler, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 1)

        gpu.uniform1f(uniforms.noise, FrameComposition.currentNoise)
        gpu.uniform4fv(uniforms.rayMarchSettings, SSR.rayMarchSettings)

        drawQuad()
        framebuffer.stopMapping()
    }
}