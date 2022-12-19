import GPU from "../GPU";
import UBO from "../instances/UBO";
import VisibilityRenderer from "./VisibilityRenderer";
import StaticMeshesController from "../lib/StaticMeshesController";
import StaticFBOsController from "../lib/StaticFBOsController";
import StaticShadersController from "../lib/StaticShadersController";

const RESOLUTION = 4

export default class SSAO {
    static UBO
    static noiseScale = new Float32Array(2)
    static blurSamples = 2
    static maxSamples = 64
    static enabled = true

    static set settings(data) {
        SSAO.UBO.bind()
        SSAO.UBO.updateData("settings", new Float32Array(data))
        SSAO.UBO.unbind()
    }

    static async initialize() {
        SSAO.noiseScale[0] = GPU.internalResolution.w / RESOLUTION
        SSAO.noiseScale[1] = GPU.internalResolution.h / RESOLUTION


        SSAO.UBO = new UBO(
            "Settings",
            [
                {name: "settings", type: "vec4"},
                {name: "samples", type: "vec4", dataLength: 64},
                {name: "noiseScale", type: "vec2"}
            ]
        )

        SSAO.UBO.bindWithShader(StaticShadersController.ssao.program)
        SSAO.settings = [.5, .7, -.1, 1000]

        SSAO.UBO.bind()
        SSAO.UBO.updateData("noiseScale", SSAO.noiseScale)
        SSAO.UBO.unbind()

        await StaticFBOsController.generateSSAONoise()
    }

    static #draw() {
        StaticFBOsController.ssao.startMapping()
        StaticShadersController.ssao.bind()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.visibilityDepthSampler)
        GPU.context.uniform1i(StaticShadersController.ssaoUniforms.gDepth, 0)

        GPU.context.activeTexture(GPU.context.TEXTURE1)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.noiseSampler)
        GPU.context.uniform1i(StaticShadersController.ssaoUniforms.noiseSampler, 1)

        GPU.context.uniform1i(StaticShadersController.ssaoUniforms.maxSamples, SSAO.maxSamples)

        StaticMeshesController.drawQuad()
        StaticFBOsController.ssao.stopMapping()
    }

    static #blur() {
        StaticShadersController.boxBlur.bind()
        StaticFBOsController.ssaoBlurred.startMapping()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBOsController.ssaoSampler)
        GPU.context.uniform1i(StaticShadersController.boxBlurUniforms.sampler, 0)

        GPU.context.uniform1i(StaticShadersController.boxBlurUniforms.samples, SSAO.blurSamples)

        StaticMeshesController.drawQuad()
        StaticFBOsController.ssaoBlurred.stopMapping()
    }

    static execute() {
        if (!SSAO.enabled || !VisibilityRenderer.needsSSAOUpdate)
            return

        SSAO.#draw()
        SSAO.#blur()

    }

}

