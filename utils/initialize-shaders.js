import GPUAPI from "../api/GPUAPI";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import FOLIAGE_SPRITEGlsl from "../shaders/FOLIAGE_SPRITE.glsl";
import SPRITE_FRAG from "../shaders/SPRITE.frag";
import SPRITE_VERTEX from "../shaders/SPRITE.vert";

import QUAD_VERTEX from "../shaders/QUAD.vert";
import LENS_POST_PROCESSING_FRAG from "../shaders/LENS_POST_PROCESSING.frag"

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
import BRIGHTNESS_FILTER_FRAG from "../shaders/BRIGHTNESS_FILTER.frag";
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
import CameraAPI from "../api/CameraAPI";
import LightsAPI from "../api/LightsAPI";
import MotionBlur from "../runtime/post-processing/MotionBlur";
import MOTION_BLUR_FRAG from "../shaders/MOTION_BLUR.frag";
import SpritePass from "../runtime/renderers/SpritePass";
import GAUSSIAN_FRAG from "../shaders/GAUSSIAN.frag"


export default function initializeShaders() {


    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.FOLIAGE_SPRITE, FOLIAGE_SPRITEGlsl.vertex, FOLIAGE_SPRITEGlsl.fragment)
    SpritePass.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SPRITE, SPRITE_VERTEX, SPRITE_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, CUBEMAP, IRRADIANCE_MAP)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, CUBEMAP, PREFILTERED_MAP)

    GlobalIlluminationPass.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, QUAD_VERTEX, SCREEN_SPACE_INDIRECT_FRAG)
    GlobalIlluminationPass.normalsShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI_NORMALS, QUAD_VERTEX, STOCHASTIC_NORMALS_FRAG)

    MotionBlur.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.MOTION_BLUR, QUAD_VERTEX, MOTION_BLUR_FRAG)

    AmbientOcclusion.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.AO, QUAD_VERTEX, AO_FRAG)
    AmbientOcclusion.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.AO_BLUR, QUAD_VERTEX, AO_BLUR_FRAG)
    DirectionalShadows.shadowMapShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
    OmnidirectionalShadows.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
    FrameComposition.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, QUAD_VERTEX, FXAA_FRAG)

    ScreenEffectsPass.brightShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, QUAD_VERTEX, BRIGHTNESS_FILTER_FRAG)
    ScreenEffectsPass.compositeShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, QUAD_VERTEX, LENS_POST_PROCESSING_FRAG)

    GlobalIlluminationPass.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.GAUSSIAN, QUAD_VERTEX, GAUSSIAN_FRAG)

    GBuffer.forwardDepthShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.FOLIAGE_SPRITE, ONLY_DEPTH_VERT, ONLY_DEPTH_FRAG)
    CameraAPI.UBO.bindWithShader(GBuffer.forwardDepthShader.program)

    GBuffer.deferredShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DEFERRED, QUAD_VERTEX, DEFERRED_RENDERER_FRAG)
    LightsAPI.pointLightsUBO.bindWithShader(GBuffer.deferredShader.program)
    LightsAPI.directionalLightsUBO.bindWithShader(GBuffer.deferredShader.program)

    GBuffer.toScreenShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, QUAD_VERTEX, TO_SCREEN_FRAG)

}