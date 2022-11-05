import GBuffer from "../renderers/GBuffer";
import GPU from "../../GPU";

export default class MotionBlur {
    static shader
    static uniforms = {velocityScale: 1, maxSamples: 50}
    static frameBuffer
    static workerTexture
    static enabled = true

    static initialize(){
        Object.assign(MotionBlur.uniforms, {
            currentFrame: MotionBlur.workerTexture,
            gVelocity: GBuffer.velocityMapSampler
        })
    }
    static execute() {
        if(!MotionBlur.enabled)
            return
        MotionBlur.frameBuffer.startMapping()
        MotionBlur.shader.bindForUse(MotionBlur.uniforms)
        GPU.quad.draw()
        MotionBlur.frameBuffer.stopMapping()
    }
}
