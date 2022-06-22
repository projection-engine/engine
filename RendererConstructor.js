import SYSTEMS from "./templates/SYSTEMS"

export default function RendererConstructor(canvas, resolution, Renderer){
    const ctx = canvas.getContext("webgl2", {
        antialias: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false
    })
    ctx.getExtension("EXT_color_buffer_float")
    ctx.getExtension("OES_texture_float")
    ctx.getExtension("OES_texture_float_linear")
    ctx.enable(ctx.BLEND)
    ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA)
    ctx.enable(ctx.CULL_FACE)
    ctx.cullFace(ctx.BACK)
    ctx.enable(ctx.DEPTH_TEST)
    ctx.depthFunc(ctx.LESS)
    ctx.frontFace(ctx.CCW)

    window.gpu = ctx
    window.renderer = new Renderer(
        {w: resolution[0], h:resolution[1]},
        [
            SYSTEMS.SCRIPT,
            SYSTEMS.PERF,
            SYSTEMS.TRANSFORMATION,
            SYSTEMS.SHADOWS,
            SYSTEMS.PICK,
            SYSTEMS.CAMERA_CUBE,
            SYSTEMS.CUBE_MAP,
            SYSTEMS.AO,
            SYSTEMS.DEPTH_PRE_PASS,
            SYSTEMS.PROBE,
            SYSTEMS.SSGI
        ]
    )
}