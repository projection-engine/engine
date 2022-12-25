import GPU from "../GPU";
import UBO from "../instances/UBO";
import VisibilityRenderer from "./VisibilityRenderer";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";

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

        SSAO.UBO.bindWithShader(StaticShaders.ssao.program)
        SSAO.settings = [.5, .7, -.1, 1000]

        SSAO.UBO.bind()
        SSAO.UBO.updateData("noiseScale", SSAO.noiseScale)
        SSAO.UBO.unbind()

        await StaticFBO.generateSSAONoise()
    }

    static #draw() {
        StaticFBO.ssao.startMapping()
        StaticShaders.ssao.bind()

        GPU.context.activeTexture(GPU.context.TEXTURE0)
        GPU.context.bindTexture(GPU.context.TEXTURE_2D, StaticFBO.visibilityDepthSampler)
        GPU.context.uniform1i(StaticShaders.ssaoUniforms.gDepth, 0)

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

    }

}

