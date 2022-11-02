import ScreenEffectsPass from "./ScreenEffectsPass";
import FrameComposition from "./FrameComposition";
import GBuffer from "../renderers/GBuffer";
import GPUResources from "../../GPUResources";

export default class MotionBlur {
    static shader
    static uniforms = {velocityScale: 1}
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
        GPUResources.quad.draw()
        MotionBlur.frameBuffer.stopMapping()
    }
}
