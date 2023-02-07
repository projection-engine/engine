import GPU from "../GPU";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import StaticUBOs from "../lib/StaticUBOs";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";

const RESOLUTION = 4

export default class SSAO {
    static noiseScale = new Float32Array(2)
    static blurSamples = 2
    static maxSamples = 64
    static enabled = true

    static async initialize() {
        SSAO.noiseScale[0] = GPU.internalResolution.w / RESOLUTION
        SSAO.noiseScale[1] = GPU.internalResolution.h / RESOLUTION

        StaticUBOs.ssaoUBO.bind()
        StaticUBOs.ssaoUBO.updateData("settings", new Float32Array([.5, .7, -.1, 1000]))
        StaticUBOs.ssaoUBO.updateData("noiseScale", SSAO.noiseScale)
        StaticUBOs.ssaoUBO.unbind()

        await StaticFBO.generateSSAONoise()
    }

    static #draw() {
        StaticFBO.ssao.startMapping()
        StaticShaders.ssao.bind()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.sceneDepthVelocity)
        GPU.context.uniform1i(StaticShaders.ssaoUniforms.sceneDepth, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.noiseSampler)
        GPU.context.uniform1i(StaticShaders.ssaoUniforms.noiseSampler, 1)

        GPU.context.uniform1i(StaticShaders.ssaoUniforms.maxSamples, SSAO.maxSamples)

        StaticMeshes.drawQuad()
        StaticFBO.ssao.stopMapping()
    }

    static #blur() {
        StaticShaders.boxBlur.bind()
        StaticFBO.ssaoBlurred.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.ssaoSampler)
        GPU.context.uniform1i(StaticShaders.boxBlurUniforms.sampler, 0)

        GPU.context.uniform1i(StaticShaders.boxBlurUniforms.samples, SSAO.blurSamples)

        StaticMeshes.drawQuad()
        StaticFBO.ssaoBlurred.stopMapping()
    }

    static execute() {
        if (!SSAO.enabled)
            return

        SSAO.#draw()
        SSAO.#blur()

        MetricsController.currentState = METRICS_FLAGS.SSAO
    }

}

