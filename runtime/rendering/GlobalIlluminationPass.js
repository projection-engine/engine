import GPU from "../../GPU";
import GBuffer from "./GBuffer";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import Engine from "../../Engine";
import GPUAPI from "../../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import VisibilityBuffer from "./VisibilityBuffer";

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

let shader, uniforms, normalsShader, normalUniforms
let blurShader, blurShaderUniforms

let gaussianBlurShader, gaussianBlurShaderUniforms
let ssgiQuarter, ssgiEighth, ssgiFinal
export default class GlobalIlluminationPass {
    static SSGISampler
    static SSRSampler
    static blurSamples = 4
    static SSGIEnabled = true
    static SSREnabled = true
    static unfilteredSSGISampler
    static ssgiColorGrading = new Float32Array(2)

    static normalsFBO
    static FBO
    static normalsShader
    static blurShader
    static shader
    static normalSampler
    static rayMarchSettings = new Float32Array(9)


    static initialize() {


        ssgiQuarter = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "QUARTER",
            GPU.internalResolution.w / 4,
            GPU.internalResolution.h / 4
        ).texture({
            linear: true,
            precision: gpu.RGBA8,
            type: gpu.UNSIGNED_BYTE
        })

        ssgiEighth = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "EIGHTH",
            GPU.internalResolution.w / 8,
            GPU.internalResolution.h / 8
        ).texture({
            linear: true,
            precision: gpu.RGBA8,
            type: gpu.UNSIGNED_BYTE
        })

        ssgiFinal = GPUAPI.allocateFramebuffer(
            STATIC_FRAMEBUFFERS.SSGI + "UPSCALE_HORIZONTAL",
        ).texture({
            linear: true,
            precision: gpu.RGBA8,
            type: gpu.UNSIGNED_BYTE
        })


        GlobalIlluminationPass.unfilteredSSGISampler = GlobalIlluminationPass.FBO.colors[0]
        GlobalIlluminationPass.SSGISampler = ssgiFinal.colors[0]

        GlobalIlluminationPass.SSRSampler = GlobalIlluminationPass.FBO.colors[1]

        GlobalIlluminationPass.normalSampler = GlobalIlluminationPass.normalsFBO.colors[0]


        normalsShader = GlobalIlluminationPass.normalsShader
        normalUniforms = normalsShader.uniformMap
        shader = GlobalIlluminationPass.shader
        uniforms = shader.uniformMap
        GlobalIlluminationPass.ssgiColorGrading[0] = 2.2
        GlobalIlluminationPass.ssgiColorGrading[1] = 1

        blurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.BILATERAL_BLUR)
        blurShaderUniforms = blurShader.uniformMap


        gaussianBlurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.GAUSSIAN)
        gaussianBlurShaderUniforms = gaussianBlurShader.uniformMap

    }

    static execute() {
        if (!GlobalIlluminationPass.SSREnabled && !GlobalIlluminationPass.SSGIEnabled) {
            ssgiFinal.clear()
            GlobalIlluminationPass.FBO.clear()
            return
        }
        if (GlobalIlluminationPass.SSGIEnabled) {
            GlobalIlluminationPass.normalsFBO.startMapping()
            normalsShader.bind()

            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.normalSampler)
            gpu.uniform1i(normalUniforms.gNormal, 0)

            gpu.activeTexture(gpu.TEXTURE1)
            gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
            gpu.uniform1i(normalUniforms.noise, 1)

            gpu.uniform2fv(normalUniforms.noiseScale, AmbientOcclusion.noiseScale)

            drawQuad()
            GlobalIlluminationPass.normalsFBO.stopMapping()
        }

        GlobalIlluminationPass.FBO.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.behaviourSampler)
        gpu.uniform1i(uniforms.gBehaviour, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.normalSampler)
        gpu.uniform1i(uniforms.gNormal, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, VisibilityBuffer.positionSampler)
        gpu.uniform1i(uniforms.gPosition, 2)

        gpu.activeTexture(gpu.TEXTURE3)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.normalSampler)
        gpu.uniform1i(uniforms.stochasticNormals, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
        gpu.uniform1i(uniforms.noiseSampler, 5)

        gpu.uniform2fv(uniforms.noiseScale, AmbientOcclusion.noiseScale)

        gpu.uniform2fv(uniforms.ssgiColorGrading, GlobalIlluminationPass.ssgiColorGrading)
        gpu.uniformMatrix3fv(uniforms.rayMarchSettings, false, GlobalIlluminationPass.rayMarchSettings)

        drawQuad()
        GlobalIlluminationPass.FBO.stopMapping()

        if (GlobalIlluminationPass.SSGIEnabled)
            GlobalIlluminationPass.#applyBlur()
        else
            ssgiFinal.clear()

    }

    static #applyBlur() {
        gpu.activeTexture(gpu.TEXTURE0)

        gaussianBlurShader.bind()
        ssgiQuarter.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.unfilteredSSGISampler)
        gpu.uniform1i(gaussianBlurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(gaussianBlurShaderUniforms.blurRadius, GlobalIlluminationPass.blurSamples)
        drawQuad()
        ssgiQuarter.stopMapping()

        ssgiEighth.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, ssgiQuarter.colors[0])
        gpu.uniform1i(gaussianBlurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(gaussianBlurShaderUniforms.blurRadius, GlobalIlluminationPass.blurSamples * 2)
        drawQuad()
        ssgiEighth.stopMapping()

        blurShader.bind()
        ssgiFinal.startMapping()
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.IDSampler)
        gpu.uniform1i(blurShaderUniforms.gMeshID, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, ssgiEighth.colors[0])
        gpu.uniform1i(blurShaderUniforms.sceneColor, 1)
        gpu.uniform1i(blurShaderUniforms.blurRadius, GlobalIlluminationPass.blurSamples)

        drawQuad()
        ssgiFinal.stopMapping()
    }
}