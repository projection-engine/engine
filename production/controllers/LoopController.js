import AOPass from "../passes/effects/AOPass";
import DeferredPass from "../passes/rendering/DeferredPass";
import ForwardPass from "../passes/rendering/ForwardPass";
import DepthPass from "../passes/effects/DepthPass";
import SSGIPass from "../passes/effects/SSGIPass";
import SSRPass from "../passes/effects/SSRPass";
import ShadowMapPass from "../passes/cached-rendering/ShadowMapPass";
import SpecularProbePass from "../passes/cached-rendering/SpecularProbePass";
import DiffuseProbePass from "../passes/cached-rendering/DiffuseProbePass";
import * as shaderCode from "../shaders/CUBE_MAP.glsl";
import MetricsPass from "../passes/misc/MetricsPass";
import ScriptingPass from "../passes/misc/ScriptingPass";
import ScreenEffectsPass from "../passes/post-processing/ScreenEffectsPass";
import CompositePass from "../passes/post-processing/CompositePass";
import SkyboxPass from "../passes/rendering/SkyboxPass";
import Engine from "../Engine";
import GPU from "../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import SpritePass from "../passes/effects/SpritePass";
import PhysicsPass from "../passes/math/PhysicsPass";
import WorkerController from "../workers/WorkerController";

export default class LoopController {
    static #initialized = false
    static previousFrame

    static async initialize() {
        if (LoopController.#initialized)
            return

        WorkerController.initialize()
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
        await PhysicsPass.initialize()

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


    static loop(entities) {
        if (!LoopController.#initialized)
            return

        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
        PhysicsPass.execute(entities)
        ScriptingPass.execute()
        WorkerController.execute()
        LoopController.#rendering(entities)
        ScreenEffectsPass.execute()
        CompositePass.execute()
        MetricsPass.execute()
    }
}