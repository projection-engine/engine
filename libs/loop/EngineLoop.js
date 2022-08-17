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

import Culling from "../passes/misc/Culling";
import PerformanceMetrics from "../passes/misc/PerformanceMetrics";
import Physics from "../passes/misc/Physics";
import Scripting from "../passes/misc/Scripting";
import Transformations from "../passes/misc/Transformations";
import CompositePass from "../passes/postprocessing/CompositePass";
import FinalPass from "../passes/postprocessing/FinalPass";
import SkyboxPass from "../passes/rendering/SkyboxPass";
import copyTexture from "../../services/copy-texture";
import Renderer from "../../Renderer";

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
        miscMap.set("scripting", new Scripting())
        miscMap.set("transformations", new Transformations())


        ppMap.set("worker", (new FramebufferInstance(resolution.w, resolution.h)).texture())
        ppMap.set("compositePass", new CompositePass(resolution))
        ppMap.set("finalPass", new FinalPass(ppMap.get("worker").colors[0], rendererMap.get("currentFrameFBO")))

        EngineLoop.#initialized = true
    }

    static #rendering(entities) {
        const onWrap = Renderer.params.onWrap
        const map = EngineLoop.renderMap
        const FBO = map.get("currentFrameFBO")
        const deferred = map.get("deferred")


        map.get("depthPrePass").execute()

        map.get("ao").execute(entities)
        map.get("specularProbe").execute(entities)
        map.get("diffuseProbe").execute(entities)
        map.get("shadowMap").execute(entities)

        map.get("ssGI").execute(FBO.colors[0])
        deferred.execute()
        deferred.drawBuffer(
            entities,
            isDuringBinding => {
                if (onWrap != null)
                    onWrap.execute(false, isDuringBinding)
                if (isDuringBinding)
                    map.get("skybox").execute()
            }
        )

        FBO.startMapping()
        deferred.drawFrame()
        copyTexture(FBO, deferred.frameBuffer, gpu.DEPTH_BUFFER_BIT)
        map.get("forward").execute()
        if (onWrap != null)
            onWrap.execute(true)
        FBO.stopMapping()

        map.get("ssr").execute(FBO.colors[0])
    }

    static #miscellaneous(entities) {
        const map = EngineLoop.miscMap

        map.get("culling").execute(entities)
        map.get("scripting").execute(entities)
        map.get("metrics").execute(entities)
        map.get("physics").execute(entities)
        map.get("transformations").execute(entities)
    }

    static #postProcessing(entities) {
        const ppMap = EngineLoop.ppMap
        const FBO = EngineLoop.renderMap.get("currentFrameFBO")

        ppMap.get("compositePass").execute(entities, FBO, EngineLoop.ppMap.get("worker"))
        ppMap.get("finalPass").execute()
    }


    static loop(entities) {
        if (!EngineLoop.#initialized)
            return

        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        EngineLoop.#miscellaneous(entities)
        EngineLoop.#rendering(entities)
        EngineLoop.#postProcessing(entities)
    }
}