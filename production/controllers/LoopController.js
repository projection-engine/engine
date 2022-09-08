import AOPass from "../passes/AOPass";
import DeferredPass from "../passes/DeferredPass";
import ForwardPass from "../passes/ForwardPass";
import DepthPass from "../passes/DepthPass";
import SSGIPass from "../passes/SSGIPass";
import SSRPass from "../passes/SSRPass";
import ShadowMapPass from "../passes/ShadowMapPass";
import SpecularProbePass from "../passes/SpecularProbePass";
import DiffuseProbePass from "../passes/DiffuseProbePass";
import * as shaderCode from "../shaders/CUBE_MAP.glsl";
import MetricsPass from "../passes/MetricsPass";
import ScriptingPass from "../passes/ScriptingPass";
import MovementPass from "../passes/MovementPass";
import ScreenEffectsPass from "../passes/ScreenEffectsPass";
import CompositePass from "../passes/CompositePass";
import SkyboxPass from "../passes/SkyboxPass";
import Engine from "../Engine";
import GPU from "../GPU";
import STATIC_FRAMEBUFFERS from "../../static/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";
import SpritePass from "../passes/SpritePass";

export default class LoopController {
    static #initialized = false
    static previousFrame

    static initialize() {
        if (LoopController.#initialized)
            return
        LoopController.previousFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        GPU.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, shaderCode.vertex, shaderCode.irradiance)
        GPU.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, shaderCode.vertex, shaderCode.prefiltered)

        ScreenEffectsPass.initialize()
        DepthPass.initialize()
        CompositePass.initialize()
        DeferredPass.initialize()
        AOPass.initialize()
        SSGIPass.initialize()
        SSRPass.initialize()
        DiffuseProbePass.initialize()
        ShadowMapPass.initialize()
        SpritePass.initialize()
        // miscMap.set("culling", new CullingPass())
        // miscMap.set("physics", new PhysicsPass())

        LoopController.#initialized = true
    }

    static #rendering(entities) {
        const onWrap = Engine.params.onWrap
        const FBO = LoopController.previousFrame
        DepthPass.execute()
        AOPass.execute()

        SpecularProbePass.execute()
        DiffuseProbePass.execute()
        ShadowMapPass.execute(entities)

        SSGIPass.execute()
        DeferredPass.execute()
        DeferredPass.drawBuffer(
            entities,
            isDuringBinding => {
                if (isDuringBinding)
                    SkyboxPass.execute()
                if (onWrap != null)
                    onWrap.execute(false, isDuringBinding)
            }
        )

        FBO.startMapping()
        DeferredPass.drawFrame()
        GPU.copyTexture(FBO, DeferredPass.gBuffer, gpu.DEPTH_BUFFER_BIT)
        ForwardPass.execute()
        SpritePass.execute()
        if (onWrap != null)
            onWrap.execute(true)
        FBO.stopMapping()

        SSRPass.execute()
    }

    static #miscellaneous(entities) {
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