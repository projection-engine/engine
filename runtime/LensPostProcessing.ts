import CameraAPI from "../lib/utils/CameraAPI";
import GPU from "../GPU";
import UBO from "../instances/UBO";
import StaticMeshesController from "../lib/StaticMeshesController";
import StaticFBOsController from "../lib/StaticFBOsController";
import StaticShadersController from "../lib/StaticShadersController";


export default class LensPostProcessing {
    static compositeShader
    static brightShader
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
        LensPostProcessing.UBO.bindWithShader(LensPostProcessing.compositeShader.program)


    }


    static execute() {
        const context = GPU.context
        if (CameraAPI.metadata.bloom) {
            StaticFBOsController.cache.startMapping()
            StaticShadersController.bloom.bind()
            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, StaticFBOsController.cacheSampler)
            context.uniform1i(StaticShadersController.bloomUniforms.sceneColor, 0)

            context.uniform1f(StaticShadersController.bloomUniforms.threshold, CameraAPI.metadata.bloomThreshold)

            StaticMeshesController.drawQuad()
            StaticFBOsController.cache.stopMapping()

            StaticShadersController.gaussian.bind()
            const downscale = StaticFBOsController.downscaleBloom
            const upscale = StaticFBOsController.upscaleBloom

            for (let i = 0; i < downscale.length; i++) {
                const fbo = downscale[i]
                fbo.startMapping()
                context.activeTexture(context.TEXTURE0)
                context.bindTexture(context.TEXTURE_2D, i > 0 ? downscale[i - 1].colors[0] : StaticFBOsController.cache.colors[0])
                context.uniform1i(StaticShadersController.gaussianUniforms.sceneColor, 0)
                context.uniform1i(StaticShadersController.gaussianUniforms.blurRadius, CameraAPI.metadata.bloomQuality)

                StaticMeshesController.drawQuad()
                fbo.stopMapping()
            }


            StaticShadersController.upSampling.bind()
            const upSamplingShaderUniforms = StaticShadersController.upSamplingUniforms
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
                StaticMeshesController.drawQuad()
                fbo.stopMapping()
            }

            StaticFBOsController.lens.startMapping()
            context.activeTexture(context.TEXTURE0)
            context.bindTexture(context.TEXTURE_2D, StaticFBOsController.cache.colors[0])
            context.uniform1i(upSamplingShaderUniforms.nextSampler, 0)

            context.activeTexture(context.TEXTURE1)
            context.bindTexture(context.TEXTURE_2D, upscale[upscale.length - 1].colors[0])
            context.uniform1i(upSamplingShaderUniforms.blurred, 1)
            context.uniform1f(upSamplingShaderUniforms.sampleScale, CameraAPI.metadata.bloomOffset)
            StaticMeshesController.drawQuad()
            StaticFBOsController.lens.stopMapping()
        } else
            StaticFBOsController.lens.clear()

        StaticFBOsController.cache.startMapping()
        StaticShadersController.lens.bind()

        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.lens.colors[0])
        context.uniform1i(StaticShadersController.lensUniforms.blurred, 0)

        context.activeTexture(context.TEXTURE1)
        context.bindTexture(context.TEXTURE_2D, StaticFBOsController.cacheSampler)
        context.uniform1i(StaticShadersController.lensUniforms.sceneColor, 1)

        StaticMeshesController.drawQuad()
        StaticFBOsController.cache.stopMapping()
    }

}