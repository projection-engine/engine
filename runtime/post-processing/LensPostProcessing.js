import CameraAPI from "../../lib/utils/CameraAPI";
import GPU from "../../GPU";
import UBO from "../../instances/UBO";
import GPUAPI from "../../lib/rendering/GPUAPI";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";


let shader, uniforms, metadata
let outputFBO
let blurShader, blurShaderUniforms
let upSamplingShader, upSamplingShaderUniforms
const downscale = []
const upscale = []

export default class LensPostProcessing {
    static workerTexture
    static outputFBO
    static blurBuffers
    static upSampledBuffers
    static compositeShader

    static brightShader
    static baseFBO
    static UBO
    static blurredSampler

    static initialize() {
        LensPostProcessing.UBO = new UBO(
            "LensEffects",
            [
                {type: "float", name: "distortionIntensity"},
                {type: "float", name: "chromaticAberrationIntensity"},
                {type: "bool", name: "distortionEnabled"},
                {type: "bool", name: "chromaticAberrationEnabled"},
                {type: "bool", name: "bloomEnabled"},]
        )
        LensPostProcessing.UBO.bindWithShader(LensPostProcessing.compositeShader.program)
        shader = LensPostProcessing.compositeShader
        uniforms = shader.uniformMap

        metadata = CameraAPI.metadata
        LensPostProcessing.blurredSampler = LensPostProcessing.baseFBO.colors[0]
        outputFBO = LensPostProcessing.outputFBO
        LensPostProcessing.generateBuffers(7)

        upSamplingShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.UPSAMPLING_BLOOM)
        upSamplingShaderUniforms = upSamplingShader.uniformMap
        blurShader = GPU.shaders.get(STATIC_SHADERS.PRODUCTION.GAUSSIAN)
        blurShaderUniforms = blurShader.uniformMap
    }

    static generateBuffers(q) {
        let w = GPU.internalResolution.w, h = GPU.internalResolution.h
        for (let i = 0; i < q; i++) {
            w /= 2
            h /= 2
            downscale.push(GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SCREEN_EFFECTS + "DOWNSCALE" + i, w, h).texture({linear: true}))
        }
        for (let i = 0; i < (q / 2 - 1); i++) {
            w *= 4
            h *= 4
            upscale.push(GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.SCREEN_EFFECTS + "UPSCALE" + i, w, h).texture({linear: true}))
        }
    }

    static execute() {
        if (metadata.bloom) {
            outputFBO.startMapping()
            LensPostProcessing.brightShader.bindForUse({
                sceneColor: LensPostProcessing.workerTexture,
                threshold: metadata.bloomThreshold
            })
            drawQuad()
            outputFBO.stopMapping()

            blurShader.bind()
            for (let i = 0; i < downscale.length; i++) {
                const fbo = downscale[i]
                fbo.startMapping()
                gpu.activeTexture(gpu.TEXTURE0)
                gpu.bindTexture(gpu.TEXTURE_2D, i > 0 ? downscale[i - 1].colors[0] : outputFBO.colors[0])
                gpu.uniform1i(blurShaderUniforms.sceneColor, 0)
                gpu.uniform1i(blurShaderUniforms.blurRadius, metadata.bloomQuality)

                drawQuad()
                fbo.stopMapping()
            }

            upSamplingShader.bind()
            for (let i = 0; i < upscale.length; i++) {
                const fbo = upscale[i]
                fbo.startMapping()
                gpu.activeTexture(gpu.TEXTURE0)
                gpu.bindTexture(gpu.TEXTURE_2D, i > 0 ? upscale[i - 1].colors[0] : undefined)
                gpu.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

                gpu.activeTexture(gpu.TEXTURE1)
                gpu.bindTexture(gpu.TEXTURE_2D, downscale[downscale.length - 1 - i].colors[0])
                gpu.uniform1i(upSamplingShaderUniforms.blurred, 1)
                gpu.uniform1f(upSamplingShaderUniforms.sampleScale, metadata.bloomOffset)
                drawQuad()
                fbo.stopMapping()
            }

            LensPostProcessing.baseFBO.startMapping()
            gpu.activeTexture(gpu.TEXTURE0)
            gpu.bindTexture(gpu.TEXTURE_2D, outputFBO.colors[0])
            gpu.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

            gpu.activeTexture(gpu.TEXTURE1)
            gpu.bindTexture(gpu.TEXTURE_2D, upscale[upscale.length - 1].colors[0])
            gpu.uniform1i(upSamplingShaderUniforms.blurred, 1)
            gpu.uniform1f(upSamplingShaderUniforms.sampleScale, metadata.bloomOffset)
            drawQuad()
            LensPostProcessing.baseFBO.stopMapping()
        } else
            LensPostProcessing.baseFBO.clear()

        outputFBO.startMapping()
        shader.bind()

        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, LensPostProcessing.baseFBO.colors[0])
        gpu.uniform1i(uniforms.blurred, 0)

        gpu.activeTexture(gpu.TEXTURE1)
        gpu.bindTexture(gpu.TEXTURE_2D, LensPostProcessing.workerTexture)
        gpu.uniform1i(uniforms.sceneColor, 1)

        drawQuad()
        outputFBO.stopMapping()
    }

}