import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS"
import GPU from "../../GPU";

import ImageProcessor from "../../lib/math/ImageProcessor";
import UBO from "../../instances/UBO";
import VisibilityBuffer from "./VisibilityBuffer";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";

const RESOLUTION = 4

let shader, uniforms, blurShader, blurShaderUniforms
let framebuffer, blurredFramebuffer
export default class SSAO {
    static UBO
    static #ready = false
    static filteredSampler
    static unfilteredSampler
    static noiseSampler
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
        framebuffer = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.AO_SRC)
        blurredFramebuffer = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.AO)

        SSAO.unfilteredSampler = framebuffer.colors[0]
        SSAO.filteredSampler = blurredFramebuffer.colors[0]// AmbientOcclusion.blurredFBO.colors[0]

        SSAO.noiseScale[0] = GPU.internalResolution.w / RESOLUTION
        SSAO.noiseScale[1] = GPU.internalResolution.h / RESOLUTION

        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.AO)
        uniforms = shader.uniformMap

        blurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BOX_BLUR)
        blurShaderUniforms = blurShader.uniformMap

        SSAO.UBO = new UBO(
            "Settings",
            [
                {name: "settings", type: "vec4"},
                {name: "samples", type: "vec4", dataLength: 64},
                {name: "noiseScale", type: "vec2"}
            ]
        )

        SSAO.UBO.bindWithShader(shader.program)
        SSAO.settings = [.5, .7, -.1, 1000]
        window.upd = (d) =>  SSAO.settings = [.5, .7, -.1, d]
        SSAO.UBO.bind()
        SSAO.UBO.updateData("noiseScale", SSAO.noiseScale)
        SSAO.UBO.unbind()

        const {kernels, noise} = await ImageProcessor.request(
            IMAGE_WORKER_ACTIONS.NOISE_DATA,
            {w: RESOLUTION, h: RESOLUTION}
        )

        SSAO.UBO.bind()
        SSAO.UBO.updateData("samples", kernels)
        SSAO.UBO.unbind()
        SSAO.noiseSampler = gpu.createTexture()

        gpu.bindTexture(gpu.TEXTURE_2D, SSAO.noiseSampler)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, RESOLUTION, RESOLUTION)
        gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, RESOLUTION, RESOLUTION, gpu.RG, gpu.FLOAT, noise)

        SSAO.#ready = true
    }

    static #draw() {
        framebuffer.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthEntityIDSampler)
        gpu.uniform1i(uniforms.gDepth, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, SSAO.noiseSampler)
        gpu.uniform1i(uniforms.noiseSampler, 1)

        gpu.uniform1i(uniforms.maxSamples, SSAO.maxSamples)

        drawQuad()
        framebuffer.stopMapping()
    }

    static #blur() {
        blurShader.bind()
        blurredFramebuffer.startMapping()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, SSAO.unfilteredSampler)
        gpu.uniform1i(blurShaderUniforms.sampler, 0)

        gpu.uniform1i(blurShaderUniforms.samples, SSAO.blurSamples)

        drawQuad()
        blurredFramebuffer.stopMapping()
    }

    static execute() {
        if (!SSAO.enabled || !SSAO.#ready)
            return

        SSAO.#draw()
        SSAO.#blur()

    }

}

