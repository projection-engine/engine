import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";

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


export default class SSGI {
    static blurSamples = 4
    static enabled = true
    static ssgiColorGrading = new Float32Array(2)
    static rayMarchSettings = new Float32Array(3)

    static initialize() {
        SSGI.ssgiColorGrading[0] = 2.2
        SSGI.ssgiColorGrading[1] = 1
    }

    static execute() {
        if (!SSGI.enabled) {
            StaticFBO.ssgi.clear()
            return
        }
        const context = GPU.context
        StaticFBO.ssgi.startMapping()
        StaticShaders.ssgi.bind()

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.visibilityDepthSampler)
        context.uniform1i(StaticShaders.ssgiUniforms.scene_depth, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing2Sampler)
        context.uniform1i(StaticShaders.ssgiUniforms.previousFrame, 1)

        context.uniform2fv(StaticShaders.ssgiUniforms.ssgiColorGrading, SSGI.ssgiColorGrading)
        context.uniform3fv(StaticShaders.ssgiUniforms.rayMarchSettings, SSGI.rayMarchSettings)

        StaticMeshes.drawQuad()
        StaticFBO.ssgi.stopMapping()
        SSGI.#applyBlur()

    }

    static #applyBlur() {
        const context = GPU.context
        context.activeTexture(context.TEXTURE0)
        const ssgiQuarter = StaticFBO.ssgiQuarter,
            ssgiEighth = StaticFBO.ssgiEighth

        StaticShaders.gaussian.bind()
        ssgiQuarter.startMapping()
        context.bindTexture(context.TEXTURE_2D, StaticFBO.ssgiSampler)
        context.uniform1i(StaticShaders.gaussianUniforms.sceneColor, 0)
        context.uniform1i(StaticShaders.gaussianUniforms.blurRadius, SSGI.blurSamples)
        StaticMeshes.drawQuad()
        ssgiQuarter.stopMapping()

        ssgiEighth.startMapping()
        context.bindTexture(context.TEXTURE_2D, ssgiQuarter.colors[0])
        context.uniform1i(StaticShaders.gaussianUniforms.sceneColor, 0)
        context.uniform1i(StaticShaders.gaussianUniforms.blurRadius, SSGI.blurSamples * 2)
        StaticMeshes.drawQuad()
        ssgiEighth.stopMapping()

        StaticShaders.bilateralBlur.bind()
        StaticFBO.ssgi.startMapping()
        context.bindTexture(context.TEXTURE_2D, StaticFBO.visibilityEntitySampler)
        context.uniform1i(StaticShaders.bilateralBlurUniforms.entityIDSampler, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, ssgiEighth.colors[0])
        context.uniform1i(StaticShaders.bilateralBlurUniforms.sceneColor, 1)
        context.uniform1i(StaticShaders.bilateralBlurUniforms.blurRadius, SSGI.blurSamples)

        StaticMeshes.drawQuad()
        StaticFBO.ssgi.stopMapping()
    }
}