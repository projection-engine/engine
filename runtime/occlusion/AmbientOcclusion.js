import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS"
import GPU from "../../GPU";

import ImageProcessor from "../../lib/math/ImageProcessor";
import UBO from "../../instances/UBO";
import VisibilityBuffer from "../rendering/VisibilityBuffer";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import Engine from "../../Engine";

const RESOLUTION = 4

let shader, uniforms, blurShader, blurShaderUniforms
export default class AmbientOcclusion {
    static UBO
    static #ready = false
    static framebuffer
    static blurredFBO
    static filteredSampler
    static unfilteredSampler
    static noiseSampler
    static noiseScale = new Float32Array(2)
    static blurSamples = 2
    static maxSamples = 64
    static enabled = true

    static set settings(data) {
        AmbientOcclusion.UBO.bind()
        AmbientOcclusion.UBO.updateData("settings", new Float32Array(data))
        AmbientOcclusion.UBO.unbind()
    }

    static async initialize() {
        AmbientOcclusion.unfilteredSampler = AmbientOcclusion.framebuffer.colors[0]
        AmbientOcclusion.filteredSampler = AmbientOcclusion.blurredFBO.colors[0]// AmbientOcclusion.blurredFBO.colors[0]

        AmbientOcclusion.noiseScale[0] = GPU.internalResolution.w / RESOLUTION
        AmbientOcclusion.noiseScale[1] = GPU.internalResolution.h / RESOLUTION

        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.AO)
        uniforms = shader.uniformMap

        blurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BOX_BLUR)
        blurShaderUniforms = blurShader.uniformMap

        AmbientOcclusion.UBO = new UBO(
            "Settings",
            [
                {name: "settings", type: "vec3"},
                {name: "samples", type: "vec4", dataLength: 64},
                {name: "noiseScale", type: "vec2"}
            ]
        )

        AmbientOcclusion.UBO.bindWithShader(shader.program)
        AmbientOcclusion.settings = [.5, .7, -.1]
        AmbientOcclusion.UBO.bind()
        AmbientOcclusion.UBO.updateData("noiseScale", AmbientOcclusion.noiseScale)
        AmbientOcclusion.UBO.unbind()

        const {kernels, noise} = await ImageProcessor.request(
            IMAGE_WORKER_ACTIONS.NOISE_DATA,
            {w: RESOLUTION, h: RESOLUTION}
        )

        AmbientOcclusion.UBO.bind()
        AmbientOcclusion.UBO.updateData("samples", kernels)
        AmbientOcclusion.UBO.unbind()
        AmbientOcclusion.noiseSampler = gpu.createTexture()

        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu.NEAREST)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu.REPEAT)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu.REPEAT)
        gpu.texStorage2D(gpu.TEXTURE_2D, 1, gpu.RG16F, RESOLUTION, RESOLUTION)
        gpu.texSubImage2D(gpu.TEXTURE_2D, 0, 0, 0, RESOLUTION, RESOLUTION, gpu.RG, gpu.FLOAT, noise)

        AmbientOcclusion.#ready = true

    }

    static #draw() {
        AmbientOcclusion.framebuffer.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.depthEntityIDSampler)
        gpu.uniform1i(uniforms.gDepth, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
        gpu.uniform1i(uniforms.noiseSampler, 1)

        gpu.uniform1i(uniforms.maxSamples, AmbientOcclusion.maxSamples)

        drawQuad()
        AmbientOcclusion.framebuffer.stopMapping()
    }

    static #blur() {
        blurShader.bind()
        AmbientOcclusion.blurredFBO.startMapping()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.unfilteredSampler)
        gpu.uniform1i(blurShaderUniforms.sampler, 0)

        gpu.uniform1i(blurShaderUniforms.samples, AmbientOcclusion.blurSamples)

        drawQuad()
        AmbientOcclusion.blurredFBO.stopMapping()
    }

    static execute() {
        if (!AmbientOcclusion.enabled || !AmbientOcclusion.#ready) {
            AmbientOcclusion.blurredFBO.clear()
            return
        }

        AmbientOcclusion.#draw()
        AmbientOcclusion.#blur()

    }

}

