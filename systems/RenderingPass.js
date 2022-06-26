import AmbientOcclusionPass from "./passes/AmbientOcclusionPass"
import DeferredPass from "./passes/DeferredPass"
import ForwardPass from "./passes/ForwardPass"
import DepthPrePass from "./passes/DepthPrePass"
import SSGIPass from "./passes/SSGIPass"
import SSRPass from "./passes/SSRPass"
import ShadowMapPass from "./passes/ShadowMapPass"
import SpecularProbePass from "./passes/SpecularProbePass"
import DiffuseProbePass from "./passes/DiffuseProbePass"
import FramebufferInstance from "../instances/FramebufferInstance"
import ENVIRONMENT from "../ENVIRONMENT"
import {copyTexture} from "../utils/utils"

export default class RenderingPass{
    constructor(resolution={w: window.screen.width, h: window.screen.height}) {
        this.ao = new AmbientOcclusionPass(resolution)
        this.deferred = new DeferredPass(resolution)
        this.forward = new ForwardPass(resolution)
        this.depthPrePass = new DepthPrePass(resolution)
        this.ssGI = new SSGIPass(resolution)
        this.ssr = new SSRPass(resolution)
        this.shadowMap = new ShadowMapPass(resolution)
        this.specularProbe = new SpecularProbePass(resolution)
        this.diffuseProbe = new DiffuseProbePass(resolution)
        
        this.currentFrameFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture().depthTest()
        
    }

    prepareFrame(options, data, entities, entitiesMap, onWrap){
        this.currentFrameFBO.startMapping()
        this.deferred.drawFrame()

        copyTexture(this.currentFrameFBO, this.deferred.frameBuffer,  window.gpu.DEPTH_BUFFER_BIT)

        this.forward.execute(options, data)
        if (onWrap && window.renderer.environment !== ENVIRONMENT.PROD)
            onWrap.execute(options, data, entities, entitiesMap, true)
        this.currentFrameFBO.stopMapping()
    }
    get currentFrame(){
        return this.currentFrameFBO.colors[0]
    }
    execute(options,  data, entities, entitiesMap, updateAllLights, onWrap) {
        this.depthPrePass.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.ao.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.specularProbe.execute(options, data, entities, entitiesMap, updateAllLights)
        this.diffuseProbe.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.shadowMap.execute(options, data, entities, entitiesMap, updateAllLights)

        this.ssGI.execute(options, this.currentFrame)
        this.deferred.execute(options, data)
        this.deferred.drawBuffer(options, data, entities, entitiesMap, onWrap)
        this.prepareFrame(options, data, entities, entitiesMap, onWrap)

        this.ssr.execute(options, this.currentFrame)

    }
}