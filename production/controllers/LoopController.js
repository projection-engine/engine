import AOPass from "../templates/passes/AOPass";
import DeferredPass from "../templates/passes/DeferredPass";
import ForwardPass from "../templates/passes/ForwardPass";
import DepthPass from "../templates/passes/DepthPass";
import SSGIPass from "../templates/passes/SSGIPass";
import SSRPass from "../templates/passes/SSRPass";
import ShadowMapPass from "../templates/passes/ShadowMapPass";
import SpecularProbePass from "../templates/passes/SpecularProbePass";
import DiffuseProbePass from "../templates/passes/DiffuseProbePass";
import ShaderInstance from "./instances/ShaderInstance";
import * as shaderCode from "../data/shaders/CUBE_MAP.glsl";

import CullingPass from "../templates/passes/CullingPass";
import MetricsPass from "../templates/passes/MetricsPass";
import PhysicsPass from "../templates/passes/PhysicsPass";
import ScriptingPass from "../templates/passes/ScriptingPass";
import MovementPass from "../templates/passes/MovementPass";
import ScreenEffectsPass from "../templates/passes/ScreenEffectsPass";
import CompositePass from "../templates/passes/CompositePass";
import SkyboxPass from "../templates/passes/SkyboxPass";
import RendererController from "./RendererController";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";

export default class LoopController {
    static #initialized = false
    static renderMap = new Map()
    static miscMap = new Map()
    static previousFrame

    static initialize() {
        if (LoopController.#initialized)
            return
        LoopController.previousFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        GPU.allocateShader(STATIC_SHADERS.IRRADIANCE, shaderCode.vertex, shaderCode.irradiance)
        GPU.allocateShader(STATIC_SHADERS.PREFILTERED, shaderCode.vertex, shaderCode.prefiltered)

        ScreenEffectsPass.initialize()
        DepthPass.initialize()
        CompositePass.initialize()
        DeferredPass.initialize()
        AOPass.initialize()
        SSGIPass.initialize()
        SSRPass.initialize()

        const rendererMap = LoopController.renderMap
        const miscMap = LoopController.miscMap

        rendererMap.set("skybox", new SkyboxPass())
        rendererMap.set("forward", new ForwardPass())


        rendererMap.set("shadowMap", new ShadowMapPass())
        rendererMap.set("specularProbe", new SpecularProbePass())
        rendererMap.set("diffuseProbe", new DiffuseProbePass())

        // miscMap.set("culling", new CullingPass())
        // miscMap.set("physics", new PhysicsPass())

        LoopController.#initialized = true
    }

    static #rendering(entities) {
        const onWrap = RendererController.params.onWrap
        const map = LoopController.renderMap
        const FBO = LoopController.previousFrame
        DepthPass.execute()
        AOPass.execute()

        map.get("specularProbe").execute(entities)
        map.get("diffuseProbe").execute(entities)
        map.get("shadowMap").execute(entities)

        SSGIPass.execute()
        DeferredPass.execute()
        DeferredPass.drawBuffer(
            entities,
            isDuringBinding => {
                if (onWrap != null)
                    onWrap.execute(false, isDuringBinding)
                if (isDuringBinding)
                    map.get("skybox").execute()
            }
        )

        FBO.startMapping()
        DeferredPass.drawFrame()
        GPU.copyTexture(FBO, DeferredPass.gBuffer, gpu.DEPTH_BUFFER_BIT)
        map.get("forward").execute()
        if (onWrap != null)
            onWrap.execute(true)
        FBO.stopMapping()

        SSRPass.execute()
    }

    static #miscellaneous(entities) {
        const map = LoopController.miscMap

        // map.get("culling").execute(entities)
        ScriptingPass.execute()
        MetricsPass.execute(entities)
        // map.get("physics").execute(entities)
        MovementPass.execute(entities)
    }


    static loop(entities) {
        if (!LoopController.#initialized)
            return

        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        LoopController.#miscellaneous(entities)
        LoopController.#rendering(entities)

        // POST PROCESSING
        ScreenEffectsPass.execute()
        CompositePass.execute()
    }
}