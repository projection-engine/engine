import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import GBuffer from "./runtime/renderers/GBuffer";
import ForwardRenderer from "./runtime/renderers/ForwardRenderer";
import GlobalIlluminationPass from "./runtime/GlobalIlluminationPass";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import SpecularProbePass from "./runtime/renderers/SpecularProbePass";
import DiffuseProbePass from "./runtime/renderers/DiffuseProbePass";

import executeScripts from "./runtime/execute-scripts";
import ScreenEffectsPass from "./runtime/post-processing/ScreenEffectsPass";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import SkyboxPass from "./runtime/renderers/SkyboxPass";
import Engine from "./Engine";
import SpritePass from "./runtime/renderers/SpritePass";
import PhysicsPass from "./runtime/PhysicsPass";
import TransformationPass from "./runtime/TransformationPass";
import GPUAPI from "./api/GPUAPI";
import OmnidirectionalShadows from "./runtime/occlusion/OmnidirectionalShadows";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import CameraAPI from "./api/CameraAPI";
import renderScene from "./runtime/render-scene";

let then = 0
export default class Loop {
    static #rendering() {
        const onWrap = Engine.params.onWrap
        const FBO = Engine.currentFrameFBO

        SpecularProbePass.execute()
        DiffuseProbePass.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()

        GlobalIlluminationPass.execute()
        renderScene()
        AmbientOcclusion.execute()
        GBuffer.drawBuffer(
            Engine.entities,
            isDuringBinding => {
                if (isDuringBinding)
                    SkyboxPass.execute()
                if (onWrap != null)
                    onWrap.execute(false, isDuringBinding)
            }
        )

        FBO.startMapping()
        GBuffer.drawFrame()
        GPUAPI.copyTexture(FBO, GBuffer.gBuffer, gpu.DEPTH_BUFFER_BIT)
        ForwardRenderer.execute()

        SpritePass.execute()
        if (onWrap != null)
            onWrap.execute(true)
        FBO.stopMapping()
    }


    static #callback(METRICS) {

        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)
        let start = performance.now()
        if (!Engine.isDev)
            executeScripts()
        METRICS.scripting = performance.now() - start

        start = performance.now()
        PhysicsPass.execute()
        TransformationPass.execute()
        METRICS.simulation = performance.now() - start

        start = performance.now()
        Loop.#rendering()
        ScreenEffectsPass.execute()
        MotionBlur.execute()
        FrameComposition.execute()
        METRICS.rendering = performance.now() - start
    }

    static loop() {
        CameraAPI.updateFrame()
        const METRICS = Engine.metrics
        const now = performance.now()
        const el = now - then
        Engine.elapsed = el
        then = now

        METRICS.frameRate = 1000 / el
        METRICS.frameTime = el

        Loop.#callback(METRICS)
        CameraAPI.updateFrame()
        Engine.frameID = requestAnimationFrame(() => Loop.loop())
    }
}