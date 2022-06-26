import System from "../basic/System"

import FramebufferInstance from "../instances/FramebufferInstance"
import CompositePass from "./postprocessing/CompositePass"
import FinalPass from "./postprocessing/FinalPass"


let shader, workerFBO
export default class PostProcessingPass extends System {
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        super()

        this.cacheFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.compositPass = new CompositePass(resolution)
        this.finalPass = new FinalPass(resolution)
    }

    execute(options,  data, entities, entitiesMap) {
        if(!shader) {
            shader = window.renderer.renderingPass.deferred.toScreenShader
            workerFBO = window.renderer.renderingPass.currentFrameFBO
        }

        this.compositPass.execute(options, data, entities, entitiesMap, workerFBO, this.cacheFBO)
        this.finalPass.execute(options, this.cacheFBO, workerFBO)
    }
}