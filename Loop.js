import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import GBuffer from "./runtime/rendering/GBuffer";
import ForwardRenderer from "./runtime/rendering/ForwardRenderer";
import GlobalIlluminationPass from "./runtime/rendering/GlobalIlluminationPass";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import SpecularProbePass from "./runtime/rendering/SpecularProbePass";
import DiffuseProbePass from "./runtime/rendering/DiffuseProbePass";

import executeScripts from "./runtime/misc/execute-scripts";
import LensPostProcessing from "./runtime/post-processing/LensPostProcessing";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import SkyboxPass from "./runtime/rendering/SkyboxPass";
import Engine from "./Engine";
import SpritePass from "./runtime/rendering/SpritePass";
import PhysicsPass from "./runtime/misc/PhysicsPass";
import TransformationPass from "./runtime/misc/TransformationPass";
import GPUAPI from "./lib/rendering/GPUAPI";
import OmnidirectionalShadows from "./runtime/occlusion/OmnidirectionalShadows";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import CameraAPI from "./lib/utils/CameraAPI";
import SceneRenderer from "./runtime/rendering/SceneRenderer";
import BenchmarkAPI from "./lib/utils/BenchmarkAPI";
import BENCHMARK_KEYS from "./static/BENCHMARK_KEYS";
import VisibilityBuffer from "./runtime/rendering/VisibilityBuffer";

let FBO, previous = 0
export default class Loop {
    static #beforeDrawing = () => null
    static #duringDrawing = () => null
    static #afterDrawing = () => null

    static linkToExecutionPipeline(before, during, after) {
        if(typeof before === "function"){
            Loop.#beforeDrawing = before
        }else
            Loop.#beforeDrawing = () => null

        if(typeof during === "function"){
            Loop.#duringDrawing = during
        }else
            Loop.#duringDrawing = () => null

        if(typeof after === "function"){
            Loop.#afterDrawing = after
        }else
            Loop.#afterDrawing = () => null
    }

    static linkParams() {
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
        SceneRenderer.drawDeferred()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DEFERRED_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.AMBIENT_OCCLUSION)
        AmbientOcclusion.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.AMBIENT_OCCLUSION)

        Loop.#beforeDrawing()

        FBO.startMapping()
        BenchmarkAPI.track(BENCHMARK_KEYS.SKYBOX)
        SkyboxPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SKYBOX)

        Loop.#duringDrawing()

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

        Loop.#afterDrawing()

        FBO.stopMapping()
        BenchmarkAPI.track(BENCHMARK_KEYS.GLOBAL_ILLUMINATION_PASS)
        GlobalIlluminationPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.GLOBAL_ILLUMINATION_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.POST_PROCESSING)
        LensPostProcessing.execute()
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

        AmbientOcclusion.execute()
        VisibilityBuffer.execute()

        Loop.#beforeDrawing()

        GBuffer.drawMaterials()

        FBO.startMapping()
        SkyboxPass.execute()
        Loop.#duringDrawing()
        GBuffer.drawToBuffer()
        // GPUAPI.copyTexture(FBO, VisibilityBuffer.buffer, gpu.DEPTH_BUFFER_BIT)

        ForwardRenderer.execute()
        SpritePass.execute()
        Loop.#afterDrawing()
        FBO.stopMapping()

        GlobalIlluminationPass.execute()
        LensPostProcessing.execute()
        // Bokeh.execute()
        MotionBlur.execute()
        FrameComposition.execute()

    }

    static loop(current) {
        try{
        Engine.elapsed = current - previous
        previous = current
        gpu.clear(gpu.COLOR_BUFFER_BIT | gpu.DEPTH_BUFFER_BIT)

        if (!Engine.benchmarkMode)
            Loop.#callback()
        else {
            BenchmarkAPI.track(BENCHMARK_KEYS.ALL)
            Loop.#benchmarkMode()
            BenchmarkAPI.endTrack(BENCHMARK_KEYS.ALL)
        }

        CameraAPI.updateFrame()
        Engine.frameID = requestAnimationFrame(Loop.loop)
        }catch (err){
            console.log(err)
        }
    }
}