import AmbientOcclusionPass from "./passes/AmbientOcclusionPass"
import DeferredPass from "./passes/DeferredPass"
import ForwardPass from "./passes/ForwardPass"
import DepthPrePass from "./passes/DepthPrePass"
import SSGIPass from "./passes/SSGIPass"
import SSRPass from "./passes/SSRPass"
import ShadowMapPass from "./passes/ShadowMapPass"
import SpecularProbePass from "./passes/SpecularProbePass"
import DiffuseProbePass from "./passes/DiffuseProbePass"

export default class RenderingPass{
    constructor(resolution) {
        this.ao = new AmbientOcclusionPass(resolution)
        this.deferred = new DeferredPass(resolution)
        this.forward = new ForwardPass(resolution)
        this.depthPrePass = new DepthPrePass(resolution)
        this.ssGI = new SSGIPass(resolution)
        this.ssr = new SSRPass(resolution)
        this.shadowMap = new ShadowMapPass(resolution)
        this.specularProbe = new SpecularProbePass(resolution)
        this.diffuseProbe = new DiffuseProbePass(resolution)
    }

    execute(options,  data, entities, entitiesMap, updateAllLights) {
        this.depthPrePass.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.ao.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.specularProbe.execute(options, data, entities, entitiesMap, updateAllLights)
        this.diffuseProbe.execute(options,  data, entities, entitiesMap, updateAllLights)
        this.shadowMap.execute(options, data, entities, entitiesMap, updateAllLights)

        this.ssGI.execute(options, data, entities, entitiesMap, updateAllLights)
        this.deferred.execute(options, data, entities, entitiesMap, updateAllLights)
        this.forward.execute(options, data, entities, entitiesMap, updateAllLights)
        this.ssr.execute(options, data, entities, entitiesMap, updateAllLights)
    }
}