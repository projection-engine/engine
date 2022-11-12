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
import BenchmarkAPI from "./api/BenchmarkAPI";
import BENCHMARK_KEYS from "./static/BENCHMARK_KEYS";

let onWrap, FBO, previous = 0
export default class Loop {
    static linkParams() {
        onWrap = Engine.params.onWrap
        FBO = Engine.currentFrameFBO
    }

    static #benchmarkMode() {

        BenchmarkAPI.track(BENCHMARK_KEYS.SCRIPT_PASS)
        if (!Engine.isDev)
            executeScripts()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SCRIPT_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.PHYSICS_PASS)
        PhysicsPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.PHYSICS_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.TRANSFORMATION_PASS)
        TransformationPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.TRANSFORMATION_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.SPECULAR_PROBE)
        SpecularProbePass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SPECULAR_PROBE)

        BenchmarkAPI.track(BENCHMARK_KEYS.DIFFUSE_PROBE)
        DiffuseProbePass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DIFFUSE_PROBE)

        BenchmarkAPI.track(BENCHMARK_KEYS.DIRECTIONAL_SHADOWS)
        DirectionalShadows.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DIRECTIONAL_SHADOWS)

        BenchmarkAPI.track(BENCHMARK_KEYS.OMNIDIRECTIONAL_SHADOWS)
        OmnidirectionalShadows.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.OMNIDIRECTIONAL_SHADOWS)

        BenchmarkAPI.track(BENCHMARK_KEYS.DEFERRED_PASS)
        renderScene()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DEFERRED_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.AMBIENT_OCCLUSION)
        AmbientOcclusion.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.AMBIENT_OCCLUSION)

        if (onWrap != null)
            onWrap.execute(false, false)

        FBO.startMapping()
        BenchmarkAPI.track(BENCHMARK_KEYS.SKYBOX)
        SkyboxPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SKYBOX)

        if (onWrap != null)
            onWrap.execute(false, true)

        BenchmarkAPI.track(BENCHMARK_KEYS.DEFERRED_DRAWING)
        GBuffer.drawBuffer()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DEFERRED_DRAWING)

        GPUAPI.copyTexture(FBO, GBuffer.gBuffer, gpu.DEPTH_BUFFER_BIT)

        BenchmarkAPI.track(BENCHMARK_KEYS.FORWARD_PASS)
        ForwardRenderer.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.FORWARD_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.SPRITE_PASS)
        SpritePass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SPRITE_PASS)

        if (onWrap != null)
            onWrap.execute(true, false)
        FBO.stopMapping()

        BenchmarkAPI.track(BENCHMARK_KEYS.GLOBAL_ILLUMINATION_PASS)
        GlobalIlluminationPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.GLOBAL_ILLUMINATION_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.POST_PROCESSING)
        ScreenEffectsPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.POST_PROCESSING)

        BenchmarkAPI.track(BENCHMARK_KEYS.MOTION_BLUR)
        MotionBlur.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.MOTION_BLUR)

        BenchmarkAPI.track(BENCHMARK_KEYS.FRAME_COMPOSITION)
        FrameComposition.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.FRAME_COMPOSITION)
    }

    static #callback() {
        if (!Engine.isDev)
            executeScripts()
        PhysicsPass.execute()
        TransformationPass.execute()

        SpecularProbePass.execute()
        DiffuseProbePass.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()
        renderScene()
        AmbientOcclusion.execute()
        if (onWrap != null)
            onWrap.execute(false, false)

        FBO.startMapping()
        SkyboxPass.execute()
        if (onWrap != null)
            onWrap.execute(false, true)
        GBuffer.drawBuffer()
        GPUAPI.copyTexture(FBO, GBuffer.gBuffer, gpu.DEPTH_BUFFER_BIT)
        ForwardRenderer.execute()
        SpritePass.execute()
        if (onWrap != null)
            onWrap.execute(true, false)
        FBO.stopMapping()

        GlobalIlluminationPass.execute()

        ScreenEffectsPass.execute()
        MotionBlur.execute()
        FrameComposition.execute()
    }

    static loop(current) {
        Engine.elapsed = current - previous
        previous = current
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        if (!Engine.benchmarkMode) {
            Loop.#callback()

        } else {
            BenchmarkAPI.track(BENCHMARK_KEYS.ALL)
            Loop.#benchmarkMode()
            BenchmarkAPI.endTrack(BENCHMARK_KEYS.ALL)
        }
        CameraAPI.updateFrame()
        Engine.frameID = requestAnimationFrame(Loop.loop)
    }
}