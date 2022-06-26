import System from "../basic/System"

import FramebufferInstance from "../instances/FramebufferInstance"
import ForwardPass from "./passes/ForwardPass"
import {copyTexture} from "../utils/utils"
import ShaderInstance from "../instances/ShaderInstance"
import * as shaderCode from "../shaders/FXAA.glsl"
import ENVIRONMENT from "../ENVIRONMENT"
import CompositePass from "./postprocessing/CompositePass"
import FinalPass from "./postprocessing/FinalPass"


export default class PostProcessingPass extends System {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.FBO = (new FramebufferInstance(resolution.w, resolution.h)).texture().depthTest()
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.noFxaaFragment)
        this.forwardSystem = new ForwardPass()


        this.workerFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture().depthTest()
        this.cacheFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()


        this.compositPass = new CompositePass(resolution)
        this.finalPass = new FinalPass(resolution)
    }
    get lastFrame(){
        return this.FBO.colors[0]
    }
    execute(options,  data, entities, entitiesMap, onWrap) {
        super.execute()
        const isProd = window.renderer.environment === ENVIRONMENT.PROD
        this.FBO.startMapping()

        if (onWrap && !isProd)
            onWrap.execute(options,  data, entities, entitiesMap, false)

        window.renderer.renderingPass.deferred.drawBuffer(options, data)
        this.FBO.stopMapping()

        this.workerFBO.startMapping()
        this.shader.use()
        this.shader.bindForUse({
            uSampler: this.FBO.colors[0]
        })
        this.workerFBO.draw()

        copyTexture(this.workerFBO, window.renderer.renderingPass.deferred.frameBuffer,  window.gpu.DEPTH_BUFFER_BIT)

        this.forwardSystem.execute(options, data, this.FBO.colors[0])
        if (onWrap && !isProd)
            onWrap.execute(options, data, entities, entitiesMap, true)
        this.workerFBO.stopMapping()

        this.compositPass.execute(options, data, entities, entitiesMap, [this.workerFBO, this.cacheFBO])
        let worker = this.cacheFBO
        let output = this.workerFBO
        this.finalPass.execute(options, worker, output)

    }
}