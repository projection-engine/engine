import GPU from "../../GPU";
import GBuffer from "./GBuffer";
import AmbientOcclusion from "../occlusion/AmbientOcclusion";
import Engine from "../../Engine";
import GPUAPI from "../../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";

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
let  finalSSGIFBO, tempSSGIFBO
export default class GlobalIlluminationPass {
    static SSGISampler
    static SSRSampler
    static blurSamples = 3
    static SSGIEnabled = true
    static SSREnabled = true
    static unfilteredSSGISampler
    static ssgiColorGrading = new Float32Array(2)
    static tempSSGIFBO
    static finalSSGIFBO
    static normalsFBO
    static FBO
    static normalsShader
    static blurShader
    static shader
    static normalSampler
    static rayMarchSettings = new Float32Array(9)


    static initialize() {
        tempSSGIFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI + "DOWNSCALE1", GPU.internalResolution.w/6, GPU.internalResolution.h/6).texture({linear: true, precision: gpu.RGBA8, type: gpu.UNSIGNED_BYTE})
        finalSSGIFBO = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI + "DOWNSCALE2", GPU.internalResolution.w/4, GPU.internalResolution.h/4).texture({linear: true, precision: gpu.RGBA8, type: gpu.UNSIGNED_BYTE})


        GlobalIlluminationPass.tempSSGIFBO = tempSSGIFBO
        GlobalIlluminationPass.finalSSGIFBO = finalSSGIFBO
        GlobalIlluminationPass.unfilteredSSGISampler = GlobalIlluminationPass.FBO.colors[0]
        GlobalIlluminationPass.SSRSampler = GlobalIlluminationPass.FBO.colors[1]

        GlobalIlluminationPass.normalSampler = GlobalIlluminationPass.normalsFBO.colors[0]
        GlobalIlluminationPass.SSGISampler = finalSSGIFBO.colors[0]

        normalsShader = GlobalIlluminationPass.normalsShader
        normalUniforms = normalsShader.uniformMap
        shader = GlobalIlluminationPass.shader
        uniforms = shader.uniformMap
        GlobalIlluminationPass.ssgiColorGrading[0] = 2.2
        GlobalIlluminationPass.ssgiColorGrading[1] = 1

        blurShader = GlobalIlluminationPass.blurShader
        blurShaderUniforms = blurShader.uniformMap
    }

    static execute() {
        if (!GlobalIlluminationPass.SSREnabled && !GlobalIlluminationPass.SSGIEnabled) {
            finalSSGIFBO.clear()
            GlobalIlluminationPass.FBO.clear()
            return
        }
        if (GlobalIlluminationPass.SSGIEnabled) {
            GlobalIlluminationPass.normalsFBO.startMapping()
            normalsShader.bind()

            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.baseNormalSampler)
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
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.baseNormalSampler)
        gpu.uniform1i(uniforms.gNormal, 1)

        gpu.activeTexture(gpu.TEXTURE2)
        gpu.bindTexture(gpu.TEXTURE_2D, GBuffer.positionSampler)
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
            finalSSGIFBO.clear()

    }

    static #applyBlur() {
        blurShader.bind()
        tempSSGIFBO.startMapping()
        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.unfilteredSSGISampler)
        gpu.uniform1i(blurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(blurShaderUniforms.blurRadius, GlobalIlluminationPass.blurSamples)

        drawQuad()
        tempSSGIFBO.stopMapping()
        finalSSGIFBO.startMapping()
        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, tempSSGIFBO.colors[0])
        gpu.uniform1i(blurShaderUniforms.sceneColor, 0)
        gpu.uniform1i(blurShaderUniforms.blurRadius, GlobalIlluminationPass.blurSamples)

        drawQuad()
        finalSSGIFBO.stopMapping()
    }
}