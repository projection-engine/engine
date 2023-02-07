import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import Framebuffer from "../instances/Framebuffer";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";
import EngineResources from "../lib/EngineResources";

/**
 * rayMarchSettings definition:
 *
 * 0: SSR-falloff
 * 1: SSR-minRayStep
 * 2: SSR-stepSize
 * 3: SSGI_stepSize
 * 4: SSGI_intensity
 * 5: ENABLED_SSGI
 * 6: ENABLED_SSR
 * 7: SSGI_maxSteps
 * 8: SSR_maxSteps
 */

let cleared = false
export default class SSGI {
    static blurSamples = 5
    static blurRadius = 5
    static enabled = true

    static execute() {
        if (!SSGI.enabled) {
            if (!cleared) {
                StaticFBO.ssgi.clear()
                cleared = true
            }
            return
        }
        cleared = false
        const context = GPU.context
        const uniforms = StaticShaders.ssgiUniforms
        StaticFBO.ssgi.startMapping()
        StaticShaders.ssgi.bind()

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.sceneDepthVelocity)
        context.uniform1i(uniforms.sceneDepth, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing2Sampler)
        context.uniform1i(uniforms.previousFrame, 1)

        context.uniform3fv(uniforms.rayMarchSettings, EngineResources.SSGISettings)

        StaticMeshes.drawQuad()
        SSGI.#applyBlur(context, StaticFBO.ssgiFallback, StaticFBO.ssgiSampler, true)
        SSGI.#applyBlur(context, StaticFBO.ssgi, StaticFBO.ssgiFallbackSampler, false)

        MetricsController.currentState = METRICS_FLAGS.SSGI
    }

    static #applyBlur(context: WebGL2RenderingContext, FBO: Framebuffer, color: WebGLTexture, first: boolean) {
        const uniforms = StaticShaders.bilateralBlurUniforms


        if (first) {
            StaticShaders.bilateralBlur.bind()

            context.uniform1f(uniforms.blurRadius, SSGI.blurRadius)
            context.uniform1i(uniforms.samples, SSGI.blurSamples)
            context.uniform2fv(uniforms.bufferResolution, StaticFBO.ssgiFallback.resolution)

            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, StaticFBO.entityIDSampler)
            context.uniform1i(uniforms.entityIDSampler, 0)
        }
        else
            context.uniform1i(uniforms.samples, SSGI.blurSamples/2)
        FBO.startMapping()

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, color)
        context.uniform1i(uniforms.sceneColor, 1)

        StaticMeshes.drawQuad()
        FBO.stopMapping()
    }
}