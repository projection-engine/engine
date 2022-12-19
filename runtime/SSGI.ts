import GPU from "../GPU";
import StaticMeshesController from "../lib/StaticMeshesController";
import StaticFBOsController from "../lib/StaticFBOsController";
import StaticShadersController from "../lib/StaticShadersController";

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
            StaticFBOsController.ssgiFinal.clear()
            return
        }
        const context = GPU.context
        StaticFBOsController.ssgi.startMapping()
        StaticShadersController.ssgi.bind()

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.visibilityDepthSampler)
        context.uniform1i(StaticShadersController.ssgiUniforms.scene_depth, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.currentFrameSampler)
        context.uniform1i(StaticShadersController.ssgiUniforms.previousFrame, 1)

        context.uniform2fv(StaticShadersController.ssgiUniforms.ssgiColorGrading, SSGI.ssgiColorGrading)
        context.uniform3fv(StaticShadersController.ssgiUniforms.rayMarchSettings, SSGI.rayMarchSettings)

        StaticMeshesController.drawQuad()
        StaticFBOsController.ssgi.stopMapping()

        if (SSGI.enabled)
            SSGI.#applyBlur()
        else
            StaticFBOsController.ssgiFinal.clear()

    }

    static #applyBlur() {
        const context = GPU.context
        context.activeTexture(context.TEXTURE0)
        const ssgiQuarter = StaticFBOsController.ssgiQuarter,
            ssgiEighth = StaticFBOsController.ssgiEighth,
            ssgiFinal = StaticFBOsController.ssgiFinal

        StaticShadersController.gaussian.bind()
        ssgiQuarter.startMapping()
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.ssgiSampler)
        context.uniform1i(StaticShadersController.gaussianUniforms.sceneColor, 0)
        context.uniform1i(StaticShadersController.gaussianUniforms.blurRadius, SSGI.blurSamples)
        StaticMeshesController.drawQuad()
        ssgiQuarter.stopMapping()

        ssgiEighth.startMapping()
        context.bindTexture(context.TEXTURE_2D, ssgiQuarter.colors[0])
        context.uniform1i(StaticShadersController.gaussianUniforms.sceneColor, 0)
        context.uniform1i(StaticShadersController.gaussianUniforms.blurRadius, SSGI.blurSamples * 2)
        StaticMeshesController.drawQuad()
        ssgiEighth.stopMapping()

        StaticShadersController.bilateralBlur.bind()
        ssgiFinal.startMapping()
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.visibilityEntitySampler)
        context.uniform1i(StaticShadersController.bilateralBlurUniforms.entityIDSampler, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, ssgiEighth.colors[0])
        context.uniform1i(StaticShadersController.bilateralBlurUniforms.sceneColor, 1)
        context.uniform1i(StaticShadersController.bilateralBlurUniforms.blurRadius, SSGI.blurSamples)

        StaticMeshesController.drawQuad()
        ssgiFinal.stopMapping()
    }
}