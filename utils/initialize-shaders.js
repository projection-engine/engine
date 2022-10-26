import GPUController from "../GPUController";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import FOLIAGE_SPRITEGlsl from "../shaders/FOLIAGE_SPRITE.glsl";
import SPRITEGlsl from "../shaders/SPRITE.glsl";
import DepthPass from "../runtime/renderers/DepthPass";
import DEPTH_PASSGlsl from "../shaders/DEPTH_PASS.glsl";
import QUAD_VERTEX from "../shaders/QUAD.vert";
import * as shaderCode from "../shaders/CUBE_MAP.glsl";
import SSGIPass from "../runtime/SSGIPass";
import * as SCREEN_SPACE from "../shaders/SCREEN_SPACE.glsl";
import SSRPass from "../runtime/SSRPass";
import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import AO_FRAG from "../shaders/AO.frag";
import AO_BLUR_FRAG from "../shaders/AO-BLUR.frag";
import DirectionalShadows from "../runtime/occlusion/DirectionalShadows";
import * as smShaders from "../shaders/SHADOW_MAP.glsl";
import OmnidirectionalShadows from "../runtime/occlusion/OmnidirectionalShadows";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import FXAA_FRAG from "../shaders/FXAA.frag";
import ScreenEffectsPass from "../runtime/post-processing/ScreenEffectsPass";
import * as SCREEN_EFFECTS from "../shaders/EFFECTS.glsl";
import DeferredRenderer from "../runtime/renderers/DeferredRenderer";
import DEFERRED_RENDERER_FRAG from "../shaders/DEFERRED_RENDERER.frag";
import TO_SCREEN_FRAG from "../shaders/TO_SCREEN.frag";

export default function initializeShaders(){
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FOLIAGE_SPRITE, FOLIAGE_SPRITEGlsl.vertex, FOLIAGE_SPRITEGlsl.fragment)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SPRITE, SPRITEGlsl.vertex, SPRITEGlsl.fragment)
    DepthPass.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DEPTH, DEPTH_PASSGlsl.depthVertex, DEPTH_PASSGlsl.depthFragment)
    DepthPass.normalShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.NORMAL_RECONSTRUCTION, QUAD_VERTEX, DEPTH_PASSGlsl.normalReconstructionFragment)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, shaderCode.vertex, shaderCode.irradiance)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, shaderCode.vertex, shaderCode.prefiltered)
    SSGIPass.ssgiShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, QUAD_VERTEX, SCREEN_SPACE.ssGI)
    SSGIPass.normalsShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, QUAD_VERTEX, SCREEN_SPACE.stochasticNormals)
    SSRPass.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSR, QUAD_VERTEX, SCREEN_SPACE.fragment)
    AmbientOcclusion.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO, QUAD_VERTEX, AO_FRAG)
    AmbientOcclusion.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO_BLUR, QUAD_VERTEX, AO_BLUR_FRAG)
    DirectionalShadows.shadowMapShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
    OmnidirectionalShadows.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
    FrameComposition.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, QUAD_VERTEX, FXAA_FRAG)
    ScreenEffectsPass.compositeShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, QUAD_VERTEX, SCREEN_EFFECTS.compositeFragment)
    ScreenEffectsPass.upSamplingShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BILINEAR_UP_SAMPLING, QUAD_VERTEX, SCREEN_EFFECTS.bilinearUpSampling)
    ScreenEffectsPass.brightShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, QUAD_VERTEX, SCREEN_EFFECTS.brightFragment,)
    ScreenEffectsPass.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BOX_BLUR, QUAD_VERTEX, SCREEN_EFFECTS.blurBox)
    DeferredRenderer.deferredShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DEFERRED, QUAD_VERTEX, DEFERRED_RENDERER_FRAG)
    DeferredRenderer.toScreenShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, QUAD_VERTEX, TO_SCREEN_FRAG)

}