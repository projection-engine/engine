import AmbientOcclusionPass from "../passes/rendering/AmbientOcclusionPass";
import DeferredPass from "../passes/rendering/DeferredPass";
import ForwardPass from "../passes/rendering/ForwardPass";
import DepthPrePass from "../passes/rendering/DepthPrePass";
import SSGIPass from "../passes/rendering/SSGIPass";
import SSRPass from "../passes/rendering/SSRPass";
import ShadowMapPass from "../passes/rendering/ShadowMapPass";
import SpecularProbePass from "../passes/rendering/SpecularProbePass";
import DiffuseProbePass from "../passes/rendering/DiffuseProbePass";
import FramebufferInstance from "../instances/FramebufferInstance";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from "../../data/shaders/CUBE_MAP.glsl";
import {copyTexture} from "../../utils/utils";
import Culling from "../passes/misc/Culling";
import PerformanceMetrics from "../passes/misc/PerformanceMetrics";
import Physics from "../passes/misc/Physics";
import Scripting from "../passes/misc/Scripting";
import Transformations from "../passes/misc/Transformations";
import CompositePass from "../passes/postprocessing/CompositePass";
import FinalPass from "../passes/postprocessing/FinalPass";
import SkyboxPass from "../passes/rendering/SkyboxPass";

export default class EngineLoop {
    static #initialized = false
    static renderMap = new Map()
    static miscMap = new Map()
    static ppMap = new Map()

    static initialize(resolution) {
        if (EngineLoop.#initialized)
            return

        const rendererMap = EngineLoop.renderMap
        const miscMap = EngineLoop.miscMap
        const ppMap = EngineLoop.ppMap
        rendererMap.set("skybox", new SkyboxPass())
        rendererMap.set("ao", new AmbientOcclusionPass(resolution))
        rendererMap.set("deferred", new DeferredPass(resolution))
        rendererMap.set("forward", new ForwardPass())
        rendererMap.set("depthPrePass", new DepthPrePass(resolution))
        rendererMap.set("ssGI", new SSGIPass(resolution))
        rendererMap.set("ssr", new SSRPass(resolution))
        rendererMap.set("shadowMap", new ShadowMapPass(resolution))
        rendererMap.set("specularProbe", new SpecularProbePass())
        rendererMap.set("diffuseProbe", new DiffuseProbePass(resolution))
        rendererMap.set("currentFrameFBO", (new FramebufferInstance(resolution.w, resolution.h)).texture().depthTest())
        rendererMap.set("prefilteredShader", new ShaderInstance(shaderCode.vertex, shaderCode.prefiltered))
        rendererMap.set("irradianceShader", new ShaderInstance(shaderCode.vertex, shaderCode.irradiance))


        miscMap.set("culling", new Culling())
        miscMap.set("metrics", new PerformanceMetrics())
        miscMap.set("physics", new Physics())
        miscMap.set("scripting", new Scripting(resolution))
        miscMap.set("transformations", new Transformations())


        ppMap.set("worker", (new FramebufferInstance(resolution.w, resolution.h)).texture())
        ppMap.set("compositePass", new CompositePass(resolution))
        ppMap.set("finalPass", new FinalPass(ppMap.get("worker").colors[0], rendererMap.get("currentFrameFBO")))

        EngineLoop.#initialized = true
    }

    static #rendering(options, data, entities, onWrap) {
        const map = EngineLoop.renderMap
        const FBO = map.get("currentFrameFBO")
        const deferred = map.get("deferred")


        map.get("depthPrePass").execute(options, data)

        map.get("ao").execute(options, data, entities)
        map.get("specularProbe").execute(options, data, entities)
        map.get("diffuseProbe").execute(options, data, entities)
        map.get("shadowMap").execute(options, data, entities)

        map.get("ssGI").execute(options, FBO.colors[0])
        deferred.execute(options, data)
        deferred.drawBuffer(options, data, entities, () => {

            if (onWrap != null)
                onWrap.execute(options, data)
            map.get("skybox").execute(options, data)
        })

        FBO.startMapping()
        deferred.drawFrame()
        copyTexture(FBO, deferred.frameBuffer, window.gpu.DEPTH_BUFFER_BIT)
        map.get("forward").execute(options, data)
        if (onWrap != null)
            onWrap.execute(options, data, true)
        FBO.stopMapping()

        map.get("ssr").execute(options, FBO.colors[0])
    }

    static #miscellaneous(options, data, entities) {
        const map = EngineLoop.miscMap
        map.get("culling").execute(options, data, entities)
        map.get("scripting").execute(options, data, entities)
        map.get("metrics").execute(options, data, entities)
        map.get("physics").execute(options, data, entities)
        map.get("transformations").execute(options, data, entities)
    }

    static #postProcessing(options, data, entities) {
        const ppMap = EngineLoop.ppMap
        const FBO = EngineLoop.renderMap.get("currentFrameFBO")

        ppMap.get("compositePass").execute(options, data, entities, FBO, EngineLoop.ppMap.get("worker"))
        ppMap.get("finalPass").execute(options)
    }

    static loop(options, data, entities, onWrap) {
        if (!EngineLoop.#initialized)
            return
        const gpu = window.gpu
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        EngineLoop.#miscellaneous(options, data, entities)
        EngineLoop.#rendering(options, data, entities, onWrap)
        EngineLoop.#postProcessing(options, data, entities)
    }
}