import AOPass from "./lib/passes/rendering/AOPass";
import DeferredPass from "./lib/passes/rendering/DeferredPass";
import ForwardPass from "./lib/passes/rendering/ForwardPass";
import DepthPass from "./lib/passes/rendering/DepthPass";
import SSGIPass from "./lib/passes/rendering/SSGIPass";
import SSRPass from "./lib/passes/rendering/SSRPass";
import ShadowMapPass from "./lib/passes/rendering/ShadowMapPass";
import SpecularProbePass from "./lib/passes/rendering/SpecularProbePass";
import DiffuseProbePass from "./lib/passes/rendering/DiffuseProbePass";
import * as shaderCode from "./templates/shaders/CUBE_MAP.glsl";

import ScriptingPass from "./lib/passes/misc/ScriptingPass";
import ScreenEffectsPass from "./lib/passes/post-processing/ScreenEffectsPass";
import CompositePass from "./lib/passes/post-processing/CompositePass";
import SkyboxPass from "./lib/passes/rendering/SkyboxPass";
import Engine from "./Engine";
import GPUResources from "./GPUResources";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "./static/resources/STATIC_SHADERS";
import SpritePass from "./lib/passes/rendering/SpritePass";
import PhysicsPass from "./lib/passes/misc/PhysicsPass";
import MovementWorker from "./workers/movement/MovementWorker";
import PhysicsAPI from "./lib/apis/PhysicsAPI";
import GPUController from "./GPUController";

let METRICS
export default class Loop {
    static #initialized = false
    static previousFrame

    static async initialize() {
        if (Loop.#initialized)
            return

        METRICS = Engine.metrics
        Loop.previousFrame = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.IRRADIANCE, shaderCode.vertex, shaderCode.irradiance)
        GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.PREFILTERED, shaderCode.vertex, shaderCode.prefiltered)

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
        GPUController.copyTexture(FBO, DeferredPass.gBuffer, gpu.DEPTH_BUFFER_BIT)
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

        let start = performance.now()
        ScriptingPass.execute()
        METRICS.scripting = performance.now() - start

        start = performance.now()
        PhysicsPass.execute(entities)
        MovementWorker.execute()
        METRICS.simulation = performance.now() - start

        start = performance.now()
        Loop.#rendering(entities)
        ScreenEffectsPass.execute()
        CompositePass.execute()
        METRICS.rendering = performance.now() - start
    }
}