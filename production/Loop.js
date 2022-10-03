import AOPass from "./passes/rendering/AOPass";
import DeferredPass from "./passes/rendering/DeferredPass";
import ForwardPass from "./passes/rendering/ForwardPass";
import DepthPass from "./passes/rendering/DepthPass";
import SSGIPass from "./passes/rendering/SSGIPass";
import SSRPass from "./passes/rendering/SSRPass";
import ShadowMapPass from "./passes/rendering/ShadowMapPass";
import SpecularProbePass from "./passes/rendering/SpecularProbePass";
import DiffuseProbePass from "./passes/rendering/DiffuseProbePass";
import * as shaderCode from "./shaders/CUBE_MAP.glsl";

import ScriptingPass from "./passes/misc/ScriptingPass";
import ScreenEffectsPass from "./passes/post-processing/ScreenEffectsPass";
import CompositePass from "./passes/post-processing/CompositePass";
import SkyboxPass from "./passes/rendering/SkyboxPass";
import Engine from "./Engine";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../static/resources/STATIC_SHADERS";
import SpritePass from "./passes/rendering/SpritePass";
import PhysicsPass from "./passes/misc/PhysicsPass";
import MovementWorker from "../workers/movement/MovementWorker";
import PhysicsAPI from "./apis/PhysicsAPI";
import PASS_KEYS from "../static/metrics/PASS_KEYS";

export default class Loop {
    static #initialized = false
    static previousFrame

    static async initialize() {
        if (Loop.#initialized)
            return

        Loop.previousFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        GPU.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, shaderCode.vertex, shaderCode.irradiance)
        GPU.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, shaderCode.vertex, shaderCode.prefiltered)

        ScreenEffectsPass.initialize()
        DepthPass.initialize()
        CompositePass.initialize()
        AOPass.initialize()
        SSGIPass.initialize()
        SSRPass.initialize()
        DiffuseProbePass.initialize()
        ShadowMapPass.initialize()
        SpritePass.initialize()
        DeferredPass.initialize()
        await PhysicsAPI.initialize()

        Loop.#initialized = true
    }

    static #rendering(entities) {
        const onWrap = Engine.params.onWrap
        const FBO = Loop.previousFrame
        DepthPass.execute()

        SpecularProbePass.execute()
        DiffuseProbePass.execute()
        ShadowMapPass.execute(entities)

        SSGIPass.execute()
        DeferredPass.execute()
        AOPass.execute()
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
        if (!Loop.#initialized)
            return

        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
        PhysicsPass.execute(entities)
        ScriptingPass.execute()
        MovementWorker.execute()
        Loop.#rendering(entities)
        ScreenEffectsPass.execute()
        CompositePass.execute()
    }
}