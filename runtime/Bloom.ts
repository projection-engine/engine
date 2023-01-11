import GPU from "../GPU";
import CameraAPI from "../lib/utils/CameraAPI";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import StaticMeshes from "../lib/StaticMeshes";
import Framebuffer from "../instances/Framebuffer";

export default class Bloom {
    static #upSample(fbo: Framebuffer, context: WebGL2RenderingContext, nextSampler: WebGLTexture, blurredSampler: WebGLTexture) {
        const upSamplingShaderUniforms = StaticShaders.upSamplingUniforms
        fbo.startMapping()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, nextSampler)
        context.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, blurredSampler)
        context.uniform1i(upSamplingShaderUniforms.blurred, 1)
        context.uniform1f(upSamplingShaderUniforms.sampleScale, CameraAPI.metadata.bloomOffset)
        StaticMeshes.drawQuad()
        fbo.stopMapping()
    }

    static execute() {
        const context = GPU.context
        if (!CameraAPI.metadata.bloom)
            return
        StaticFBO.lens.startMapping()
        StaticShaders.bloom.bind()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.postProcessing1Sampler)
        context.uniform1i(StaticShaders.bloomUniforms.sceneColor, 0)
        context.uniform1f(StaticShaders.bloomUniforms.threshold, CameraAPI.metadata.bloomThreshold)
        StaticMeshes.drawQuad()
        StaticFBO.lens.stopMapping()

        StaticShaders.gaussian.bind()
        const downscale = StaticFBO.downscaleBloom
        const upscale = StaticFBO.upscaleBloom

        for (let i = 0; i < downscale.length; i++) {
            const fbo = downscale[i]
            fbo.startMapping()
            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, i > 0 ? downscale[i - 1].colors[0] : StaticFBO.lensSampler)
            context.uniform1i(StaticShaders.gaussianUniforms.sceneColor, 0)
            context.uniform1i(StaticShaders.gaussianUniforms.blurRadius, CameraAPI.metadata.bloomQuality)

            StaticMeshes.drawQuad()
            fbo.stopMapping()
        }


        StaticShaders.upSampling.bind()

        for (let i = 0; i < upscale.length; i++) {
            const fbo = upscale[i]
            Bloom.#upSample(fbo, context, i > 0 ? upscale[i - 1].colors[0] : undefined, downscale[downscale.length - 1 - i].colors[0])
        }
        Bloom.#upSample(StaticFBO.postProcessing2, context, StaticFBO.postProcessing1Sampler, upscale[upscale.length - 1].colors[0])
    }

}