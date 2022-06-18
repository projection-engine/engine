import System from "../../basic/System"
import ShaderInstance from "../../instances/ShaderInstance"
import {vertex} from "../../shaders/FXAA.glsl"
import * as shaderCode from "../../shaders/EFFECTS.glsl"
import FramebufferInstance from "../../instances/FramebufferInstance"
import SYSTEMS from "../../templates/SYSTEMS"

export default class PerPixelMotionBlur extends System {
    constructor(gpu, postProcessingResolution = {w: window.screen.width, h: window.screen.height}) {
        super([])
        this.gpu = gpu

        this.velocityFramebuffer = new FramebufferInstance(gpu, postProcessingResolution.w, postProcessingResolution.h)
        this.velocityFramebuffer.texture()


        // TODO - SHADERS
        this.velocityShader = new ShaderInstance(vertex, shaderCode.blurBox, gpu)
        this.textureCopyShader = new ShaderInstance(vertex, shaderCode.blurBox, gpu)
        this.motionBlurShader = new ShaderInstance(vertex, shaderCode.blurBox, gpu)

    }

    execute(options, systems, data, entities, entitiesMap, [worker, output]) {
        super.execute()
        const {} = options


        // DRAW DIFFERENCE
        worker.startMapping()
        this.velocityShader.use()
        this.velocityShader.bindForUse({
            previousSampler: this.velocityFramebuffer.colors[0],
            currentSampler: systems[SYSTEMS.MESH].framebuffer.colors[0]
        })
        worker.draw()
        worker.stopMapping()

        // COPY CURRENT POSITION SAMPLER
        this.velocityFramebuffer.startMapping()
        this.textureCopyShader.use()
        this.textureCopyShader.bindForUse({
            sampler: systems[SYSTEMS.MESH].framebuffer.colors[0]
        })
        this.velocityFramebuffer.draw()
        this.velocityFramebuffer.stopMapping()

        // DRAW TO OUTPUT BUFFER
        output.startMapping()
        this.motionBlurShader.use()
        this.motionBlurShader.bindForUse({
            velocityScale: 1.,
            velocitySampler: worker.colors[0]
        })
        output.draw()
        output.stopMapping()
    }


}
