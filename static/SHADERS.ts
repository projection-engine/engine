import SPRITE_FRAG from "../shaders/forward-rendering/SPRITE.frag";
import SPRITE_VERTEX from "../shaders/forward-rendering/SPRITE.vert";
import QUAD_VERTEX from "../shaders/post-processing/QUAD.vert";
import LENS_POST_PROCESSING_FRAG from "../shaders/post-processing/LENS_POST_PROCESSING.frag"
import SSAO from "../shaders/post-processing/SSAO.frag";
import BOX_BLUR_FRAG from "../shaders/post-processing/BOX-BLUR.frag";
import FXAA_FRAG from "../shaders/post-processing/FRAME_COMPOSITION.frag";
import BRIGHTNESS_FILTER_FRAG from "../shaders/post-processing/BRIGHTNESS_FILTER.frag";
import SSGI from "../shaders/post-processing/SSGI.frag"
import CUBEMAP from "../shaders/forward-rendering/CUBEMAP.vert"
import PREFILTERED_MAP from "../shaders/post-processing/PREFILTERED_MAP.frag"
import IRRADIANCE_MAP from "../shaders/post-processing/IRRADIANCE_MAP.frag"
import MOTION_BLUR_FRAG from "../shaders/post-processing/MOTION_BLUR.frag";
import SceneRenderer from "../runtime/renderers/SceneRenderer";
import GAUSSIAN_FRAG from "../shaders/post-processing/GAUSSIAN.frag"
import UPSAMPLING_TEND_FRAG from "../shaders/post-processing/UPSAMPLE_TENT.glsl"
import BOKEH_FRAG from "../shaders/post-processing/BOKEH.frag"
import BILATERAL_BLUR from "../shaders/post-processing/BILATERAL_BLUR.glsl"
import BILINEAR_DOWNSCALE from "../shaders/post-processing/BILINEAR_DOWNSCALE.glsl"
import TO_SCREEN from "../shaders/post-processing/TO_SCREEN.frag"
import V_BUFFER_VERT from "../shaders/forward-rendering/V_BUFFER.vert"
import V_BUFFER_FRAG from "../shaders/forward-rendering/V_BUFFER.frag"
import OMNIDIRECTIONAL_SHADOWS from "../shaders/forward-rendering/OMNIDIRECTIONAL_SHADOWS.frag"
import SHADOWS_VERTEX from "../shaders/forward-rendering/SHADOWS.vert"
import DIRECTIONAL_SHADOWS from "../shaders/forward-rendering/DIRECTIONAL_SHADOWS.frag"
import ATMOSPHERE_FRAG from "../shaders/forward-rendering/ATMOSPHERE.frag"

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
    SpriteRenderer: SceneRenderer,
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
    DIRECTIONAL_SHADOWS,
    ATMOSPHERE_FRAG
}