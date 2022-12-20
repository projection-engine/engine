import CameraAPI from "../lib/utils/CameraAPI";
import GPU from "../GPU";
import UBO from "../instances/UBO";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";


export default class LensPostProcessing {
    static UBO

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
        LensPostProcessing.UBO.bindWithShader(StaticShaders.composition.program)
    }


    static execute() {
        const context = GPU.context
        if (CameraAPI.metadata.bloom) {
            StaticFBO.cache.startMapping()
            StaticShaders.bloom.bind()
            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, StaticFBO.cacheSampler)
            context.uniform1i(StaticShaders.bloomUniforms.sceneColor, 0)

            context.uniform1f(StaticShaders.bloomUniforms.threshold, CameraAPI.metadata.bloomThreshold)

            StaticMeshes.drawQuad()
            StaticFBO.cache.stopMapping()

            StaticShaders.gaussian.bind()
            const downscale = StaticFBO.downscaleBloom
            const upscale = StaticFBO.upscaleBloom

            for (let i = 0; i < downscale.length; i++) {
                const fbo = downscale[i]
                fbo.startMapping()
                context.activeTexture(context.TEXTURE0)
                context.bindTexture(context.TEXTURE_2D, i > 0 ? downscale[i - 1].colors[0] : StaticFBO.cache.colors[0])
                context.uniform1i(StaticShaders.gaussianUniforms.sceneColor, 0)
                context.uniform1i(StaticShaders.gaussianUniforms.blurRadius, CameraAPI.metadata.bloomQuality)

                StaticMeshes.drawQuad()
                fbo.stopMapping()
            }


            StaticShaders.upSampling.bind()
            const upSamplingShaderUniforms = StaticShaders.upSamplingUniforms
            for (let i = 0; i < upscale.length; i++) {
                const fbo = upscale[i]
                fbo.startMapping()
                context.activeTexture(context.TEXTURE0)
                context.bindTexture(context.TEXTURE_2D, i > 0 ? upscale[i - 1].colors[0] : undefined)
                context.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

                context.activeTexture(context.TEXTURE1)
                context.bindTexture(context.TEXTURE_2D, downscale[downscale.length - 1 - i].colors[0])
                context.uniform1i(upSamplingShaderUniforms.blurred, 1)
                context.uniform1f(upSamplingShaderUniforms.sampleScale, CameraAPI.metadata.bloomOffset)
                StaticMeshes.drawQuad()
                fbo.stopMapping()
            }

            StaticFBO.lens.startMapping()
            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, StaticFBO.cache.colors[0])
            context.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

            context.activeTexture(context.TEXTURE1)
            context.bindTexture(context.TEXTURE_2D, upscale[upscale.length - 1].colors[0])
            context.uniform1i(upSamplingShaderUniforms.blurred, 1)
            context.uniform1f(upSamplingShaderUniforms.sampleScale, CameraAPI.metadata.bloomOffset)
            StaticMeshes.drawQuad()
            StaticFBO.lens.stopMapping()
        } else
            StaticFBO.lens.clear()

        StaticFBO.cache.startMapping()
        StaticShaders.lens.bind()

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.lens.colors[0])
        context.uniform1i(StaticShaders.lensUniforms.blurred, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.cacheSampler)
        context.uniform1i(StaticShaders.lensUniforms.sceneColor, 1)

        StaticMeshes.drawQuad()
        StaticFBO.cache.stopMapping()
    }

}