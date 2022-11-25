import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import SPRITE_FRAG from "../shaders/SPRITE.frag";
import SPRITE_VERTEX from "../shaders/SPRITE.vert";

import QUAD_VERTEX from "../shaders/QUAD.vert";
import LENS_POST_PROCESSING_FRAG from "../shaders/LENS_POST_PROCESSING.frag"

import GlobalIlluminationPass from "../runtime/rendering/GlobalIlluminationPass";
import AmbientOcclusion from "../runtime/occlusion/AmbientOcclusion";
import AO_FRAG from "../shaders/AO.frag";
import BOX_BLUR_FRAG from "../shaders/BOX-BLUR.frag";
import DirectionalShadows from "../runtime/occlusion/DirectionalShadows";
import * as smShaders from "../shaders/SHADOW_MAP.glsl";
import OmnidirectionalShadows from "../runtime/occlusion/OmnidirectionalShadows";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import FXAA_FRAG from "../shaders/FXAA.frag";
import LensPostProcessing from "../runtime/post-processing/LensPostProcessing";
import BRIGHTNESS_FILTER_FRAG from "../shaders/BRIGHTNESS_FILTER.frag";
import SCREEN_SPACE_INDIRECT_FRAG from "../shaders/SCREEN_SPACE_INDIRECT.frag"
import CUBEMAP from "../shaders/CUBEMAP.vert"
import PREFILTERED_MAP from "../shaders/PREFILTERED_MAP.frag"
import IRRADIANCE_MAP from "../shaders/IRRADIANCE_MAP.frag"
import MotionBlur from "../runtime/post-processing/MotionBlur";
import MOTION_BLUR_FRAG from "../shaders/MOTION_BLUR.frag";
import SpritePass from "../runtime/rendering/SpritePass";
import GAUSSIAN_FRAG from "../shaders/GAUSSIAN.frag"
import UPSAMPLING_TEND_FRAG from "../shaders/UPSAMPLE_TENT.glsl"
import BOKEH_FRAG from "../shaders/BOKEH.frag"
import TEMPORAL_SUPERSAMPLING from "../shaders/TEMPORAL_SUPERSAMPLING.frag"
import BILATERAL_BLUR from "../shaders/BILATERAL_BLUR.glsl"
import BILINEAR_DOWNSCALE from "../shaders/BILINEAR_DOWNSCALE.glsl"
import TO_SCREEN from "../shaders/TO_SCREEN.vert"

import V_BUFFER_VERT from "../shaders/V_BUFFER.vert"
import V_BUFFER_FRAG from "../shaders/V_BUFFER.frag"
import DEFERRED_SHADING from "../shaders/utils/PB_LIGHT_COMPUTATION.glsl"

export default function initializeShaders() {
    SpritePass.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SPRITE, SPRITE_VERTEX, SPRITE_FRAG)

    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DEFERRED_SHADING, QUAD_VERTEX, DEFERRED_SHADING)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER, V_BUFFER_VERT, V_BUFFER_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, QUAD_VERTEX, TO_SCREEN)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DOWNSCALE, QUAD_VERTEX, BILINEAR_DOWNSCALE)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BILATERAL_BLUR, QUAD_VERTEX, BILATERAL_BLUR)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.TAA, QUAD_VERTEX, TEMPORAL_SUPERSAMPLING)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BOKEH, QUAD_VERTEX, BOKEH_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, CUBEMAP, IRRADIANCE_MAP)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, CUBEMAP, PREFILTERED_MAP)

    GlobalIlluminationPass.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, QUAD_VERTEX, SCREEN_SPACE_INDIRECT_FRAG)
    MotionBlur.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.MOTION_BLUR, QUAD_VERTEX, MOTION_BLUR_FRAG)

    AmbientOcclusion.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.AO, QUAD_VERTEX, AO_FRAG)
    AmbientOcclusion.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BOX_BLUR, QUAD_VERTEX, BOX_BLUR_FRAG)
    DirectionalShadows.shadowMapShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
    OmnidirectionalShadows.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
    FrameComposition.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, QUAD_VERTEX, FXAA_FRAG)

    LensPostProcessing.brightShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, QUAD_VERTEX, BRIGHTNESS_FILTER_FRAG)
    LensPostProcessing.compositeShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, QUAD_VERTEX, LENS_POST_PROCESSING_FRAG)

    GlobalIlluminationPass.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.GAUSSIAN, QUAD_VERTEX, GAUSSIAN_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.UPSAMPLING_BLOOM, QUAD_VERTEX, UPSAMPLING_TEND_FRAG)
}