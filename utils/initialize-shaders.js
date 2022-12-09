import GPUAPI from "../lib/rendering/GPUAPI";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import SPRITE_FRAG from "../shaders/forward-rendering/SPRITE.frag";
import SPRITE_VERTEX from "../shaders/forward-rendering/SPRITE.vert";
import QUAD_VERTEX from "../shaders/post-processing/QUAD.vert";
import LENS_POST_PROCESSING_FRAG from "../shaders/post-processing/LENS_POST_PROCESSING.frag"
import SSAO from "../shaders/post-processing/SSAO.frag";
import BOX_BLUR_FRAG from "../shaders/post-processing/BOX-BLUR.frag";
import DirectionalShadows from "../runtime/rendering/DirectionalShadows";
import * as smShaders from "../shaders/forward-rendering/SHADOW_MAP.glsl";
import OmnidirectionalShadows from "../runtime/rendering/OmnidirectionalShadows";
import FrameComposition from "../runtime/post-processing/FrameComposition";
import FXAA_FRAG from "../shaders/post-processing/FXAA.frag";
import LensPostProcessing from "../runtime/post-processing/LensPostProcessing";
import BRIGHTNESS_FILTER_FRAG from "../shaders/post-processing/BRIGHTNESS_FILTER.frag";

import SSGI from "../shaders/post-processing/SSGI.frag"
import CUBEMAP from "../shaders/forward-rendering/CUBEMAP.vert"
import PREFILTERED_MAP from "../shaders/post-processing/PREFILTERED_MAP.frag"
import IRRADIANCE_MAP from "../shaders/post-processing/IRRADIANCE_MAP.frag"
import MOTION_BLUR_FRAG from "../shaders/post-processing/MOTION_BLUR.frag";
import SpriteRenderer from "../runtime/rendering/SpriteRenderer";
import GAUSSIAN_FRAG from "../shaders/post-processing/GAUSSIAN.frag"
import UPSAMPLING_TEND_FRAG from "../shaders/post-processing/UPSAMPLE_TENT.glsl"
import BOKEH_FRAG from "../shaders/post-processing/BOKEH.frag"
import TEMPORAL_SUPERSAMPLING from "../shaders/post-processing/TEMPORAL_SUPERSAMPLING.frag"
import BILATERAL_BLUR from "../shaders/post-processing/BILATERAL_BLUR.glsl"
import BILINEAR_DOWNSCALE from "../shaders/post-processing/BILINEAR_DOWNSCALE.glsl"
import TO_SCREEN from "../shaders/post-processing/TO_SCREEN.vert"
import V_BUFFER_VERT from "../shaders/forward-rendering/V_BUFFER.vert"
import V_BUFFER_FRAG from "../shaders/forward-rendering/V_BUFFER.frag"

export default function initializeShaders() {
    SpriteRenderer.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SPRITE, SPRITE_VERTEX, SPRITE_FRAG)

    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.VISIBILITY_BUFFER, V_BUFFER_VERT, V_BUFFER_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, QUAD_VERTEX, TO_SCREEN)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DOWNSCALE, QUAD_VERTEX, BILINEAR_DOWNSCALE)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BILATERAL_BLUR, QUAD_VERTEX, BILATERAL_BLUR)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.TAA, QUAD_VERTEX, TEMPORAL_SUPERSAMPLING)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BOKEH, QUAD_VERTEX, BOKEH_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, CUBEMAP, IRRADIANCE_MAP)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, CUBEMAP, PREFILTERED_MAP)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SSGI, QUAD_VERTEX, SSGI)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.MOTION_BLUR, QUAD_VERTEX, MOTION_BLUR_FRAG)

    SSAO.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.AO, QUAD_VERTEX, SSAO)
    SSAO.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BOX_BLUR, QUAD_VERTEX, BOX_BLUR_FRAG)
    DirectionalShadows.shadowMapShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
    OmnidirectionalShadows.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
    FrameComposition.shader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, QUAD_VERTEX, FXAA_FRAG)

    LensPostProcessing.brightShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.BLOOM_MASK, QUAD_VERTEX, BRIGHTNESS_FILTER_FRAG)
    LensPostProcessing.compositeShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.SCREEN_COMPOSITION, QUAD_VERTEX, LENS_POST_PROCESSING_FRAG)

    SSGI.blurShader = GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.GAUSSIAN, QUAD_VERTEX, GAUSSIAN_FRAG)
    GPUAPI.allocateShader(STATIC_SHADERS.PRODUCTION.UPSAMPLING_BLOOM, QUAD_VERTEX, UPSAMPLING_TEND_FRAG)
}