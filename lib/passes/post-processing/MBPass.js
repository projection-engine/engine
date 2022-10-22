export default class MBPass {
    constructor( ) {
        // this.velocityFramebuffer = new Framebuffer(resolution.w, resolution.h)
        // this.velocityFramebuffer.texture()
        //
        //
        // // TODO - SHADERS
        // this.velocityShader = new Shader(vertex, shaderCode.blurBox)
        // this.textureCopyShader = new Shader(vertex, shaderCode.blurBox,)
        // this.motionBlurShader = new Shader(vertex, shaderCode.blurBox,)

    }

    execute( entities, [worker, output]) {

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
