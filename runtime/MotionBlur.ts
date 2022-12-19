import GPU from "../GPU";
import StaticMeshesController from "../lib/StaticMeshesController";
import StaticFBOsController from "../lib/StaticFBOsController";
import StaticShadersController from "../lib/StaticShadersController";


export default class MotionBlur {
    static velocityScale = 1
    static maxSamples = 50
    static enabled = true

    static execute() {
        if (!MotionBlur.enabled)
            return
        StaticFBOsController.mb.startMapping()
        StaticShadersController.mb.bind()
        const uniforms = StaticShadersController.mbUniforms
        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.cacheSampler)
        GPU.context.uniform1i(uniforms.currentFrame, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.visibilityVelocitySampler)
        GPU.context.uniform1i(uniforms.gVelocity, 1)

        GPU.context.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        GPU.context.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        StaticMeshesController.drawQuad()
        StaticFBOsController.mb.stopMapping()
    }
}
