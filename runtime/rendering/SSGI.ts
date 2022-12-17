import GPU from "../../lib/GPU";
import Engine from "../../Engine";
import GPUAPI from "../../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import VisibilityRenderer from "./VisibilityRenderer";

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

let shader, uniforms
let blurShader, blurShaderUniforms
let gaussianBlurShader, gaussianBlurShaderUniforms
let ssgiQuarter, ssgiEighth, ssgiFinal
let framebuffer

export default class SSGI {
    static FBO
    static sampler
    static blurSamples = 4
    static enabled = true
    static unfilteredSSGISampler
    static ssgiColorGrading = new Float32Array(2)
    static rayMarchSettings = new Float32Array(3)

    static initialize() {
        framebuffer = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.SSGI)
        ssgiQuarter = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "QUARTER",
            GPU.internalResolution.w / 4,
            GPU.internalResolution.h / 4
        ).texture({linear: true})

        ssgiEighth = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "EIGHTH",
            GPU.internalResolution.w / 8,
            GPU.internalResolution.h / 8
        ).texture({linear: true})

        ssgiFinal = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "UPSCALE_HORIZONTAL",
        ).texture({linear: true})


        SSGI.unfilteredSSGISampler = framebuffer.colors[0]
        SSGI.sampler = ssgiFinal.colors[0]


        shader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.SSGI)
        uniforms = shader.uniformMap
        SSGI.ssgiColorGrading[0] = 2.2
        SSGI.ssgiColorGrading[1] = 1

        blurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BILATERAL_BLUR)
        blurShaderUniforms = blurShader.uniformMap

        gaussianBlurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.GAUSSIAN)
        gaussianBlurShaderUniforms = gaussianBlurShader.uniformMap

    }

    static execute() {
        if (!SSGI.enabled) {
            ssgiFinal.clear()
            return
        }

        framebuffer.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityRenderer.depthSampler)
        gpu.uniform1i(uniforms.scene_depth, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 1)

        gpu.uniform2fv(uniforms.ssgiColorGrading, SSGI.ssgiColorGrading)
        gpu.uniform3fv(uniforms.rayMarchSettings,  SSGI.rayMarchSettings)

        drawQuad()
        framebuffer.stopMapping()

        if (SSGI.enabled)
            SSGI.#applyBlur()
        else
            ssgiFinal.clear()

    }

    static #applyBlur() {
        gpu.activeTexture(gpu.TEXTURE0)

        gaussianBlurShader.bind()
        ssgiQuarter.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, SSGI.unfilteredSSGISampler)
        gpu.uniform1i(gaussianBlurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(gaussianBlurShaderUniforms.blurRadius, SSGI.blurSamples)
        drawQuad()
        ssgiQuarter.stopMapping()

        ssgiEighth.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, ssgiQuarter.colors[0])
        gpu.uniform1i(gaussianBlurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(gaussianBlurShaderUniforms.blurRadius, SSGI.blurSamples * 2)
        drawQuad()
        ssgiEighth.stopMapping()

        blurShader.bind()
        ssgiFinal.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityRenderer.entityIDSampler)
        gpu.uniform1i(blurShaderUniforms.entityIDSampler, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, ssgiEighth.colors[0])
        gpu.uniform1i(blurShaderUniforms.sceneColor, 1)
        gpu.uniform1i(blurShaderUniforms.blurRadius, SSGI.blurSamples)

        drawQuad()
        ssgiFinal.stopMapping()
    }
}