import AOPass from "./lib/passes/AOPass";
import DeferredPass from "./lib/passes/DeferredPass";
import ForwardPass from "./lib/passes/ForwardPass";
import DepthPass from "./lib/passes/DepthPass";
import SSGIPass from "./lib/passes/SSGIPass";
import SSRPass from "./lib/passes/SSRPass";
import DirectionalShadows from "./lib/passes/DirectionalShadows";
import SpecularProbePass from "./lib/passes/SpecularProbePass";
import DiffuseProbePass from "./lib/passes/DiffuseProbePass";
import * as shaderCode from "./templates/shaders/CUBE_MAP.glsl";

import ScriptingPass from "./lib/passes/ScriptingPass";
import ScreenEffectsPass from "./lib/passes/ScreenEffectsPass";
import CompositePass from "./lib/passes/CompositePass";
import SkyboxPass from "./lib/passes/SkyboxPass";
import Engine from "./Engine";
import GPUResources from "./GPUResources";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "./static/resources/STATIC_SHADERS";
import SpritePass from "./lib/passes/SpritePass";
import PhysicsPass from "./lib/passes/PhysicsPass";
import MovementWorker from "./workers/movement/MovementWorker";
import PhysicsAPI from "./lib/apis/PhysicsAPI";
import GPUController from "./GPUController";
import OmnidirectionalShadows from "./lib/passes/OmnidirectionalShadows";

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
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
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
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()

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