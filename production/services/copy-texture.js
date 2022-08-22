export default function copyTexture(target, source,  type =gpu.DEPTH_BUFFER_BIT) {
    gpu.bindFramebuffer(gpu.READ_FRAMEBUFFER, source.FBO)
    gpu.bindFramebuffer(gpu.DRAW_FRAMEBUFFER, target.FBO)
    gpu.blitFramebuffer(
        0, 0,
        source.width, source.height,
        0, 0,
        target.width, target.height,
        type, gpu.NEAREST)
    gpu.bindFramebuffer(gpu.FRAMEBUFFER, target.FBO)
}