import VisibilityBuffer from "../rendering/VisibilityBuffer";
import GPU from "../../GPU";
import Engine from "../../Engine";


let shader, uniforms
export default class MotionBlur {
    static shader

    static velocityScale = 1
    static maxSamples = 50
    static frameBuffer
    static workerTexture
    static enabled = true

    static initialize(){

        shader = MotionBlur.shader
        uniforms = shader.uniformMap
    }
    static execute() {
        if(!MotionBlur.enabled)
            return
        MotionBlur.frameBuffer.startMapping()
        MotionBlur.shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.currentFrame, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.velocitySampler)
        gpu.uniform1i(uniforms.gVelocity, 1)

        gpu.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        gpu.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        drawQuad()
        MotionBlur.frameBuffer.stopMapping()
    }
}
