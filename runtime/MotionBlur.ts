import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";


export default class MotionBlur {
    static velocityScale = 1
    static maxSamples = 50
    static enabled = false

    static execute() {

        if (!MotionBlur.enabled)
            return
        StaticFBO.postProcessing1.startMapping()
        StaticShaders.mb.bind()
        const uniforms = StaticShaders.mbUniforms
        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.postProcessing2Sampler)
        GPU.context.uniform1i(uniforms.currentFrame, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.velocitySampler)
        GPU.context.uniform1i(uniforms.gVelocity, 1)
        GPU.context.uniform2fv(uniforms.bufferResolution, GPU.bufferResolution)

        GPU.context.uniform1f(uniforms.velocityScale, MotionBlur.velocityScale)
        GPU.context.uniform1i(uniforms.maxSamples, MotionBlur.maxSamples)

        StaticMeshes.drawQuad()
        StaticFBO.postProcessing1.stopMapping()
        MetricsController.currentState = METRICS_FLAGS.MOTION_BLUR
    }
}
