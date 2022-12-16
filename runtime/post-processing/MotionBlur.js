import VisibilityRenderer from "../rendering/VisibilityRenderer";
import GPU from "../../lib/GPU";
import Engine from "../../Engine";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";


let shader, uniforms
export default class MotionBlur {


    static velocityScale = 1
    static maxSamples = 50
    static frameBuffer
    static workerTexture
    static enabled = true

    static initialize(){
        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.MOTION_BLUR)
        uniforms = shader.uniformMap
    }
    static execute() {
        if(!MotionBlur.enabled)
            return
        MotionBlur.frameBuffer.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.currentFrame, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityRenderer.velocitySampler)
        gpu.uniform1i(uniforms.gVelocity, 1)

        gpu.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        gpu.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        drawQuad()
        MotionBlur.frameBuffer.stopMapping()
    }
}
