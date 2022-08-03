export default class PerPixelMotionBlur {
    constructor(resolution) {
        // this.velocityFramebuffer = new FramebufferInstance(resolution.w, resolution.h)
        // this.velocityFramebuffer.texture()
        //
        //
        // // TODO - SHADERS
        // this.velocityShader = new ShaderInstance(vertex, shaderCode.blurBox)
        // this.textureCopyShader = new ShaderInstance(vertex, shaderCode.blurBox,)
        // this.motionBlurShader = new ShaderInstance(vertex, shaderCode.blurBox,)

    }

    execute(options, data, entities, entitiesMap, [worker, output]) {

        // // DRAW DIFFERENCE
        // worker.startMapping()
        // this.velocityShader.use()
        // this.velocityShader.bindForUse({
        //     previousSampler: this.velocityFramebuffer.colors[0],
        //     currentSampler: systems[SYSTEMS.MESH].framebuffer.colors[0]
        // })
        // worker.draw()
        // worker.stopMapping()
        //
        // // COPY CURRENT POSITION SAMPLER
        // this.velocityFramebuffer.startMapping()
        // this.textureCopyShader.use()
        // this.textureCopyShader.bindForUse({
        //     sampler: systems[SYSTEMS.MESH].framebuffer.colors[0]
        // })
        // this.velocityFramebuffer.draw()
        // this.velocityFramebuffer.stopMapping()
        //
        // // DRAW TO OUTPUT BUFFER
        // output.startMapping()
        // this.motionBlurShader.use()
        // this.motionBlurShader.bindForUse({
        //     velocityScale: 1.,
        //     velocitySampler: worker.colors[0]
        // })
        // output.draw()
        // output.stopMapping()
    }


}
