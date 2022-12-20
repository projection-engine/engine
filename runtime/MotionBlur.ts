import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";


export default class MotionBlur {
    static velocityScale = 1
    static maxSamples = 50
    static enabled = true

    static execute() {
        if (!MotionBlur.enabled)
            return
        StaticFBO.mb.startMapping()
        StaticShaders.mb.bind()
        const uniforms = StaticShaders.mbUniforms
        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.cacheSampler)
        GPU.context.uniform1i(uniforms.currentFrame, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.visibilityVelocitySampler)
        GPU.context.uniform1i(uniforms.gVelocity, 1)

        GPU.context.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        GPU.context.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        StaticMeshes.drawQuad()
        StaticFBO.mb.stopMapping()
    }
}
