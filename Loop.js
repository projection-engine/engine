import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import GBuffer from "./runtime/renderers/GBuffer";
import ForwardRenderer from "./runtime/renderers/ForwardRenderer";
import GlobalIlluminationPass from "./runtime/GlobalIlluminationPass";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import SpecularProbePass from "./runtime/renderers/SpecularProbePass";
import DiffuseProbePass from "./runtime/renderers/DiffuseProbePass";

import ScriptingPass from "./runtime/ScriptingPass";
import ScreenEffectsPass from "./runtime/post-processing/ScreenEffectsPass";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import SkyboxPass from "./runtime/renderers/SkyboxPass";
import Engine from "./Engine";
import GPUResources from "./GPUResources";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import SpritePass from "./runtime/renderers/SpritePass";
import PhysicsPass from "./runtime/PhysicsPass";
import TransformationPass from "./runtime/TransformationPass";
import PhysicsAPI from "./api/PhysicsAPI";
import GPUController from "./GPUController";
import OmnidirectionalShadows from "./runtime/occlusion/OmnidirectionalShadows";

let METRICS
export default class Loop {
    static #initialized = false
    static previousFrame

    static async initialize() {
        if (Loop.#initialized)
            return

        METRICS = Engine.metrics
        Loop.previousFrame = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)

        ScreenEffectsPass.initialize()
        FrameComposition.initialize()
        AmbientOcclusion.initialize()
        GlobalIlluminationPass.initialize()
        DiffuseProbePass.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
        SpritePass.initialize()
        GBuffer.initialize()
        await PhysicsAPI.initialize()

        Loop.#initialized = true
    }

    static #rendering(entities) {
        const onWrap = Engine.params.onWrap
        const FBO = Loop.previousFrame

        SpecularProbePass.execute()
        DiffuseProbePass.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()

        GlobalIlluminationPass.execute()
        GBuffer.execute()
        AmbientOcclusion.execute()
        GBuffer.drawBuffer(
            entities,
            isDuringBinding => {
                if (isDuringBinding)
                    SkyboxPass.execute()
                if (onWrap != null)
                    onWrap.execute(false, isDuringBinding)
            }
        )

        FBO.startMapping()
        GBuffer.drawFrame()
        GPUController.copyTexture(FBO, GBuffer.gBuffer, gpu.DEPTH_BUFFER_BIT)
        ForwardRenderer.execute()

        SpritePass.execute()
        if (onWrap != null)
            onWrap.execute(true)
        FBO.stopMapping()
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
        TransformationPass.execute()
        METRICS.simulation = performance.now() - start

        start = performance.now()
        Loop.#rendering(entities)
        ScreenEffectsPass.execute()
        FrameComposition.execute()
        METRICS.rendering = performance.now() - start
    }
}