import GPUController from "../GPUController";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import FOLIAGE_SPRITEGlsl from "../shaders/FOLIAGE_SPRITE.glsl";
import SPRITEGlsl from "../shaders/SPRITE.glsl";
import QUAD_VERTEX from "../shaders/QUAD.vert";

import GlobalIlluminationPass from "../runtime/GlobalIlluminationPass";
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
import GBuffer from "../runtime/renderers/GBuffer";
import DEFERRED_RENDERER_FRAG from "../shaders/DEFERRED_RENDERER.frag";
import TO_SCREEN_FRAG from "../shaders/TO_SCREEN.frag";
import ONLY_DEPTH_VERT from "../shaders/ONLY_DEPTH.vert"
import ONLY_DEPTH_FRAG from "../shaders/ONLY_DEPTH.frag"
import SCREEN_SPACE_INDIRECT_FRAG from "../shaders/SCREEN_SPACE_INDIRECT.frag"
import STOCHASTIC_NORMALS_FRAG from "../shaders/STOCHASTIC_NORMALS.frag"
import CUBEMAP from "../shaders/CUBEMAP.vert"
import PREFILTERED_MAP from "../shaders/PREFILTERED_MAP.frag"
import IRRADIANCE_MAP from "../shaders/IRRADIANCE_MAP.frag"


export default function initializeShaders(){
    GBuffer.forwardDepthShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FOLIAGE_SPRITE, ONLY_DEPTH_VERT, ONLY_DEPTH_FRAG)

    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FOLIAGE_SPRITE, FOLIAGE_SPRITEGlsl.vertex, FOLIAGE_SPRITEGlsl.fragment)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SPRITE, SPRITEGlsl.vertex, SPRITEGlsl.fragment)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, CUBEMAP, IRRADIANCE_MAP)
    GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, CUBEMAP, PREFILTERED_MAP)

    GlobalIlluminationPass.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, QUAD_VERTEX, SCREEN_SPACE_INDIRECT_FRAG)
    GlobalIlluminationPass.normalsShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, QUAD_VERTEX, STOCHASTIC_NORMALS_FRAG)

    AmbientOcclusion.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO, QUAD_VERTEX, AO_FRAG)
    AmbientOcclusion.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.AO_BLUR, QUAD_VERTEX, AO_BLUR_FRAG)
    DirectionalShadows.shadowMapShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
    OmnidirectionalShadows.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
    FrameComposition.shader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, QUAD_VERTEX, FXAA_FRAG)
    ScreenEffectsPass.compositeShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, QUAD_VERTEX, SCREEN_EFFECTS.compositeFragment)
    ScreenEffectsPass.upSamplingShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BILINEAR_UP_SAMPLING, QUAD_VERTEX, SCREEN_EFFECTS.bilinearUpSampling)
    ScreenEffectsPass.brightShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, QUAD_VERTEX, SCREEN_EFFECTS.brightFragment,)
    ScreenEffectsPass.blurShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.BOX_BLUR, QUAD_VERTEX, SCREEN_EFFECTS.blurBox)
    GBuffer.deferredShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.DEFERRED, QUAD_VERTEX, DEFERRED_RENDERER_FRAG)
    GBuffer.toScreenShader = GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, QUAD_VERTEX, TO_SCREEN_FRAG)

}