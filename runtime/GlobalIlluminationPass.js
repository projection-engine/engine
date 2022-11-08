import CameraAPI from "../api/CameraAPI";
import GPU from "../GPU";
import ScreenEffectsPass from "./post-processing/ScreenEffectsPass";
import GBuffer from "./renderers/GBuffer";
import AmbientOcclusion from "./occlusion/AmbientOcclusion";
import Engine from "../Engine";
import Framebuffer from "../instances/Framebuffer";
import GPUAPI from "../api/GPUAPI";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";

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
let blurShader, blurShaderUniforms, blurBuffers
export default class GlobalIlluminationPass {
    static SSGISampler
    static SSRSampler
    static SSGIEnabled = true
    static SSREnabled = true
    static unfilteredSSGISampler
    static ssgiColorGrading = new Float32Array(2)
    static baseFBO
    static normalsFBO
    static FBO
    static normalsShader
    static blurShader
    static shader
    static downSampleBuffers
    static normalSampler
    static rayMarchSettings = new Float32Array(9)


    static initialize() {
        GlobalIlluminationPass.downSampleBuffers = [
            GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI + "DOWNSCALE1", GPU.internalResolution.w / 3, GPU.internalResolution.h / 3).texture({linear: true}),
            GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SSGI + "DOWNSCALE2", GPU.internalResolution.w / 4, GPU.internalResolution.h / 4).texture({linear: true})
        ]
        GlobalIlluminationPass.unfilteredSSGISampler = GlobalIlluminationPass.FBO.colors[0]
        GlobalIlluminationPass.SSRSampler = GlobalIlluminationPass.FBO.colors[1]

        GlobalIlluminationPass.normalSampler = GlobalIlluminationPass.normalsFBO.colors[0]
        GlobalIlluminationPass.SSGISampler = GlobalIlluminationPass.baseFBO.colors[0]

        normalsShader = GlobalIlluminationPass.normalsShader
        normalUniforms = normalsShader.uniformMap
        shader = GlobalIlluminationPass.shader
        uniforms = shader.uniformMap
        GlobalIlluminationPass.ssgiColorGrading[0] = 2.2
        GlobalIlluminationPass.ssgiColorGrading[1] = 1

        blurShader = GlobalIlluminationPass.blurShader
        blurShaderUniforms = blurShader.uniformMap
        blurBuffers = GlobalIlluminationPass.downSampleBuffers
    }

    static execute() {
        if (!GlobalIlluminationPass.SSREnabled && !GlobalIlluminationPass.SSGIEnabled) {
            GlobalIlluminationPass.baseFBO.clear()
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

            gpu.uniformMatrix4fv(normalUniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
            gpu.uniform2fv(normalUniforms.noiseScale, AmbientOcclusion.noiseScale)

            GPU.quad.draw()
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
        gpu.bindTexture(gpu.TEXTURE_2D, AmbientOcclusion.noiseSampler)
        gpu.uniform1i(uniforms.noiseSampler, 3)

        gpu.activeTexture(gpu.TEXTURE4)
        gpu.bindTexture(gpu.TEXTURE_2D, Engine.previousFrameSampler)
        gpu.uniform1i(uniforms.previousFrame, 4)

        gpu.activeTexture(gpu.TEXTURE5)
        gpu.bindTexture(gpu.TEXTURE_2D, GlobalIlluminationPass.normalSampler)
        gpu.uniform1i(uniforms.stochasticNormals, 5)


        gpu.uniformMatrix4fv(uniforms.viewMatrix, false, CameraAPI.viewMatrix)
        gpu.uniformMatrix4fv(uniforms.projection, false, CameraAPI.projectionMatrix)
        gpu.uniformMatrix4fv(uniforms.invViewMatrix, false, CameraAPI.invViewMatrix)
        gpu.uniform2fv(uniforms.noiseScale, AmbientOcclusion.noiseScale)
        gpu.uniform2fv(uniforms.ssgiColorGrading, GlobalIlluminationPass.ssgiColorGrading)

        gpu.uniformMatrix3fv(uniforms.rayMarchSettings, false, GlobalIlluminationPass.rayMarchSettings)

        GPU.quad.draw()
        GlobalIlluminationPass.FBO.stopMapping()

        if(GlobalIlluminationPass.SSGIEnabled)
            GlobalIlluminationPass.#applyBlur()
    }
    static #applyBlur(){
        blurShader.bind()
        for (let level = 0; level < 2; level++) {
            const fbo = blurBuffers[level]
            const previousColor = level > 0 ? blurBuffers[level - 1].colors[0] : GlobalIlluminationPass.unfilteredSSGISampler
            fbo.startMapping()
            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, previousColor)
            gpu.uniform1i(blurShaderUniforms.sceneColor, 0)

            gpu.uniform1f(blurShaderUniforms.blurRadius, 6)

            GPU.quad.draw()
            fbo.stopMapping()
        }

        GlobalIlluminationPass.baseFBO.startMapping()
        GBuffer.toScreenShader.bindForUse({
            uSampler: blurBuffers[1].colors[0]
        })
        GPU.quad.draw()
        GlobalIlluminationPass.baseFBO.stopMapping()

    }
}