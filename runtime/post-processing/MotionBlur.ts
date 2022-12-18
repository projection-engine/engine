import VisibilityRenderer from "../rendering/VisibilityRenderer";
import GPU from "../../GPU";
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

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, Engine.previousFrameSampler)
        GPU.context.uniform1i(uniforms.currentFrame, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, VisibilityRenderer.velocitySampler)
        GPU.context.uniform1i(uniforms.gVelocity, 1)

        GPU.context.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        GPU.context.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        GPU.drawQuad()
        MotionBlur.frameBuffer.stopMapping()
    }
}
