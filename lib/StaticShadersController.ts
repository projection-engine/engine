import Controller from "../templates/Controller";
import SHADERS from "../static/SHADERS"
import Shader from "../instances/Shader";
import compileUberShader from "../utils/compile-uber-shader";

export default class StaticShadersController extends Controller {
    static uber?:Shader
    static uberUniforms?:{ [key: string]: WebGLUniformLocation }

    static sprite?:Shader
    static spriteUniforms?:{ [key: string]: WebGLUniformLocation }

    static visibility?:Shader
    static visibilityUniforms?:{ [key: string]: WebGLUniformLocation }

    static toScreen?:Shader
    static toScreenUniforms?:{ [key: string]: WebGLUniformLocation }

    static downscale?:Shader
    static downscaleUniforms?:{ [key: string]: WebGLUniformLocation }

    static bilateralBlur?:Shader
    static bilateralBlurUniforms?:{ [key: string]: WebGLUniformLocation }

    static bokeh?:Shader
    static bokehUniforms?:{ [key: string]: WebGLUniformLocation }

    static irradiance?:Shader
    static irradianceUniforms?:{ [key: string]: WebGLUniformLocation }

    static prefiltered?:Shader
    static prefilteredUniforms?:{ [key: string]: WebGLUniformLocation }

    static ssgi?:Shader
    static ssgiUniforms?:{ [key: string]: WebGLUniformLocation }

    static mb?:Shader
    static mbUniforms?:{ [key: string]: WebGLUniformLocation }

    static ssao?:Shader
    static ssaoUniforms?:{ [key: string]: WebGLUniformLocation }

    static boxBlur?:Shader
    static boxBlurUniforms?:{ [key: string]: WebGLUniformLocation }

    static directShadows?:Shader
    static directShadowsUniforms?:{ [key: string]: WebGLUniformLocation }

    static omniDirectShadows?:Shader
    static omniDirectShadowsUniforms?:{ [key: string]: WebGLUniformLocation }

    static composition?:Shader
    static compositionUniforms?:{ [key: string]: WebGLUniformLocation }

    static bloom?:Shader
    static bloomUniforms?:{ [key: string]: WebGLUniformLocation }

    static lens?:Shader
    static lensUniforms?:{ [key: string]: WebGLUniformLocation }

    static gaussian?:Shader
    static gaussianUniforms?:{ [key: string]: WebGLUniformLocation }

    static upSampling?:Shader
    static upSamplingUniforms?:{ [key: string]: WebGLUniformLocation }

    static initialize() {
        super.initialize()
        compileUberShader()

        StaticShadersController.sprite      = new Shader( SHADERS.SPRITE_VERTEX, SHADERS.SPRITE_FRAG )
        StaticShadersController.visibility  = new Shader( SHADERS.V_BUFFER_VERT, SHADERS.V_BUFFER_FRAG )
        StaticShadersController.toScreen    = new Shader( SHADERS.QUAD_VERTEX, SHADERS.TO_SCREEN )
        StaticShadersController.downscale   = new Shader( SHADERS.QUAD_VERTEX, SHADERS.BILINEAR_DOWNSCALE )
        StaticShadersController.bilateralBlur = new Shader( SHADERS.QUAD_VERTEX, SHADERS.BILATERAL_BLUR )
        StaticShadersController.bokeh       = new Shader( SHADERS.QUAD_VERTEX, SHADERS.BOKEH_FRAG )
        StaticShadersController.irradiance  = new Shader( SHADERS.CUBEMAP, SHADERS.IRRADIANCE_MAP )
        StaticShadersController.prefiltered = new Shader( SHADERS.CUBEMAP, SHADERS.PREFILTERED_MAP )
        StaticShadersController.ssgi        = new Shader( SHADERS.QUAD_VERTEX, SHADERS.SSGI )
        StaticShadersController.mb          = new Shader( SHADERS.QUAD_VERTEX, SHADERS.MOTION_BLUR_FRAG )
        StaticShadersController.ssao        = new Shader( SHADERS.QUAD_VERTEX, SHADERS.SSAO )
        StaticShadersController.boxBlur     = new Shader( SHADERS.QUAD_VERTEX, SHADERS.BOX_BLUR_FRAG )
        StaticShadersController.directShadows = new Shader( SHADERS.SHADOWS_VERTEX, SHADERS.DIRECTIONAL_SHADOWS )
        StaticShadersController.omniDirectShadows = new Shader( SHADERS.SHADOWS_VERTEX, SHADERS.OMNIDIRECTIONAL_SHADOWS )
        StaticShadersController.composition = new Shader( SHADERS.QUAD_VERTEX, SHADERS.FXAA_FRAG )
        StaticShadersController.bloom       = new Shader( SHADERS.QUAD_VERTEX, SHADERS.BRIGHTNESS_FILTER_FRAG )
        StaticShadersController.lens        = new Shader( SHADERS.QUAD_VERTEX, SHADERS.LENS_POST_PROCESSING_FRAG )
        StaticShadersController.gaussian    = new Shader( SHADERS.QUAD_VERTEX, SHADERS.GAUSSIAN_FRAG )
        StaticShadersController.upSampling  = new Shader( SHADERS.QUAD_VERTEX, SHADERS.UPSAMPLING_TEND_FRAG )

        StaticShadersController.spriteUniforms = StaticShadersController.sprite.uniformMap
        StaticShadersController.visibilityUniforms = StaticShadersController.visibility.uniformMap
        StaticShadersController.toScreenUniforms = StaticShadersController.toScreen.uniformMap
        StaticShadersController.downscaleUniforms = StaticShadersController.downscale.uniformMap
        StaticShadersController.bilateralBlurUniforms = StaticShadersController.bilateralBlur.uniformMap
        StaticShadersController.bokehUniforms = StaticShadersController.bokeh.uniformMap
        StaticShadersController.irradianceUniforms = StaticShadersController.irradiance.uniformMap
        StaticShadersController.prefilteredUniforms = StaticShadersController.prefiltered.uniformMap
        StaticShadersController.ssgiUniforms = StaticShadersController.ssgi.uniformMap
        StaticShadersController.mbUniforms = StaticShadersController.mb.uniformMap
        StaticShadersController.ssaoUniforms = StaticShadersController.ssao.uniformMap
        StaticShadersController.boxBlurUniforms = StaticShadersController.boxBlur.uniformMap
        StaticShadersController.directShadowsUniforms = StaticShadersController.directShadows.uniformMap
        StaticShadersController.omniDirectShadowsUniforms = StaticShadersController.omniDirectShadows.uniformMap
        StaticShadersController.compositionUniforms = StaticShadersController.composition.uniformMap
        StaticShadersController.bloomUniforms = StaticShadersController.bloom.uniformMap
        StaticShadersController.lensUniforms = StaticShadersController.lens.uniformMap
        StaticShadersController.gaussianUniforms = StaticShadersController.gaussian.uniformMap
        StaticShadersController.upSamplingUniforms = StaticShadersController.upSampling.uniformMap

    }
}