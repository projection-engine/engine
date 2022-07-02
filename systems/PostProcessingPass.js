import System from "../basic/System"

import FramebufferInstance from "../instances/FramebufferInstance"
import CompositePass from "./postprocessing/CompositePass"
import FinalPass from "./postprocessing/FinalPass"


let shader
export default class PostProcessingPass extends System {
    constructor(cache, resolution={w: window.screen.width, h: window.screen.height}) {
        super()
        this.worker = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.compositPass = new CompositePass(resolution)
        this.finalPass = new FinalPass(this.worker.colors[0], cache)
        this.cache = cache
    }

    execute(options,  data, entities, entitiesMap) {
        if(!shader)
            shader = window.renderer.renderingPass.deferred.toScreenShader
        this.compositPass.execute(options, data, entities, entitiesMap, this.cache, this.worker)
        this.finalPass.execute(options)
    }
}