// @ts-ignore
import SPRITE_FRAG from "../shaders/forward-rendering/SPRITE.frag";
// @ts-ignore
import SPRITE_VERTEX from "../shaders/forward-rendering/SPRITE.vert";
// @ts-ignore
import QUAD_VERTEX from "../shaders/post-processing/QUAD.vert";
// @ts-ignore
import LENS_POST_PROCESSING_FRAG from "../shaders/post-processing/LENS_POST_PROCESSING.frag"
// @ts-ignore
import SSAO from "../shaders/post-processing/SSAO.frag";
// @ts-ignore
import BOX_BLUR_FRAG from "../shaders/post-processing/BOX-BLUR.frag";
// @ts-ignore
import FXAA_FRAG from "../shaders/post-processing/COMPOSITION.frag";

// @ts-ignore
import BRIGHTNESS_FILTER_FRAG from "../shaders/post-processing/BRIGHTNESS_FILTER.frag";
// @ts-ignore
import SSGI from "../shaders/post-processing/SSGI.frag"
// @ts-ignore
import CUBEMAP from "../shaders/forward-rendering/CUBEMAP.vert"
// @ts-ignore
import PREFILTERED_MAP from "../shaders/post-processing/PREFILTERED_MAP.frag"
// @ts-ignore
import IRRADIANCE_MAP from "../shaders/post-processing/IRRADIANCE_MAP.frag"
// @ts-ignore
import MOTION_BLUR_FRAG from "../shaders/post-processing/MOTION_BLUR.frag";
import SpriteRenderer from "../runtime/SpriteRenderer";
// @ts-ignore
import GAUSSIAN_FRAG from "../shaders/post-processing/GAUSSIAN.frag"
// @ts-ignore
import UPSAMPLING_TEND_FRAG from "../shaders/post-processing/UPSAMPLE_TENT.glsl"
// @ts-ignore
import BOKEH_FRAG from "../shaders/post-processing/BOKEH.frag"
// @ts-ignore
import BILATERAL_BLUR from "../shaders/post-processing/BILATERAL_BLUR.glsl"
// @ts-ignore
import BILINEAR_DOWNSCALE from "../shaders/post-processing/BILINEAR_DOWNSCALE.glsl"
// @ts-ignore
import TO_SCREEN from "../shaders/post-processing/TO_SCREEN.vert"
// @ts-ignore
import V_BUFFER_VERT from "../shaders/forward-rendering/V_BUFFER.vert"
// @ts-ignore
import V_BUFFER_FRAG from "../shaders/forward-rendering/V_BUFFER.frag"
// @ts-ignore
import OMNIDIRECTIONAL_SHADOWS from "../shaders/forward-rendering/OMNIDIRECTIONAL_SHADOWS.frag"
// @ts-ignore
import SHADOWS_VERTEX from "../shaders/forward-rendering/SHADOWS.vert"
// @ts-ignore
import DIRECTIONAL_SHADOWS from "../shaders/forward-rendering/DIRECTIONAL_SHADOWS.frag"

export default {
    SPRITE_FRAG,
    SPRITE_VERTEX,
    QUAD_VERTEX,
    LENS_POST_PROCESSING_FRAG,
    SSAO,
    BOX_BLUR_FRAG,
    FXAA_FRAG,
    BRIGHTNESS_FILTER_FRAG,
    SSGI,
    CUBEMAP,
    PREFILTERED_MAP,
    IRRADIANCE_MAP,
    MOTION_BLUR_FRAG,
    SpriteRenderer,
    GAUSSIAN_FRAG,
    UPSAMPLING_TEND_FRAG,
    BOKEH_FRAG,
    BILATERAL_BLUR,
    BILINEAR_DOWNSCALE,
    TO_SCREEN,
    V_BUFFER_VERT,
    V_BUFFER_FRAG,
    OMNIDIRECTIONAL_SHADOWS,
    SHADOWS_VERTEX,
    DIRECTIONAL_SHADOWS
}