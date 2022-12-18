import SSGI from "./runtime/rendering/SSGI";
import DirectionalShadows from "./runtime/rendering/DirectionalShadows";

import executeScripts from "./runtime/misc/execute-scripts";
import LensPostProcessing from "./runtime/post-processing/LensPostProcessing";
import FrameComposition from "./runtime/post-processing/FrameComposition";

import Engine from "./Engine";
import SpriteRenderer from "./runtime/rendering/SpriteRenderer";
import PhysicsPass from "./runtime/misc/PhysicsPass";
import EntityWorkerAPI from "./lib/utils/EntityWorkerAPI";
import OmnidirectionalShadows from "./runtime/rendering/OmnidirectionalShadows";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import CameraAPI from "./lib/utils/CameraAPI";
import BenchmarkAPI from "./lib/utils/BenchmarkAPI";
import BENCHMARK_KEYS from "./static/BENCHMARK_KEYS";
import VisibilityRenderer from "./runtime/rendering/VisibilityRenderer";
import LightsAPI from "./lib/utils/LightsAPI";
import SceneRenderer from "./runtime/rendering/SceneRenderer";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import GPUAPI from "./lib/rendering/GPUAPI";


let FBO, previous = 0, targetFBO
export default class Loop {
    static #beforeDrawing?: Function = () => null

    static #afterDrawing?: Function = () => null

    static linkToExecutionPipeline(after?: Function, before?: Function) {
        if (typeof before === "function") {
            Loop.#beforeDrawing = before
        } else
            Loop.#beforeDrawing = () => null

        if (typeof after === "function") {
            Loop.#afterDrawing = after
        } else
            Loop.#afterDrawing = () => null
    }

    static linkParams() {
        targetFBO = Engine.currentFrameFBO
        FBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CHACHE_BUFFER)
    }

    static #benchmarkMode() {
        FrameComposition.copyPreviousFrame()

        BenchmarkAPI.track(BENCHMARK_KEYS.PHYSICS_PASS)
        PhysicsPass.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.PHYSICS_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.DIRECTIONAL_SHADOWS)
        DirectionalShadows.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.DIRECTIONAL_SHADOWS)

        BenchmarkAPI.track(BENCHMARK_KEYS.OMNIDIRECTIONAL_SHADOWS)
        OmnidirectionalShadows.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.OMNIDIRECTIONAL_SHADOWS)


        BenchmarkAPI.track(BENCHMARK_KEYS.VISIBILITY_BUFFER)
        VisibilityRenderer.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.VISIBILITY_BUFFER)

        FBO.startMapping()
        Loop.#beforeDrawing()

        BenchmarkAPI.track(BENCHMARK_KEYS.FORWARD_PASS)

        SceneRenderer.draw()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.FORWARD_PASS)

        BenchmarkAPI.track(BENCHMARK_KEYS.SPRITE_PASS)
        SpriteRenderer.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SPRITE_PASS)

        FBO.stopMapping()

        BenchmarkAPI.track(BENCHMARK_KEYS.SSGI)
        SSGI.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.SSGI)


        BenchmarkAPI.track(BENCHMARK_KEYS.POST_PROCESSING)
        LensPostProcessing.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.POST_PROCESSING)

        BenchmarkAPI.track(BENCHMARK_KEYS.MOTION_BLUR)
        MotionBlur.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.MOTION_BLUR)

        BenchmarkAPI.track(BENCHMARK_KEYS.FRAME_COMPOSITION)
        FrameComposition.execute()
        BenchmarkAPI.endTrack(BENCHMARK_KEYS.FRAME_COMPOSITION)

        Loop.#afterDrawing()
    }

    static #callback() {
        if (!Engine.isDev)
            executeScripts()

        FrameComposition.copyPreviousFrame()

        PhysicsPass.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()

        VisibilityRenderer.execute()

        FBO.startMapping()
        Loop.#beforeDrawing()
        SceneRenderer.draw()
        SpriteRenderer.execute()

        FBO.stopMapping()

        GPUAPI.copyTexture(targetFBO, FBO, GPU.context.COLOR_BUFFER_BIT)

        SSGI.execute()

        LensPostProcessing.execute()
        MotionBlur.execute()
        FrameComposition.execute()

        Loop.#afterDrawing()
    }

    static loop(current) {
        try {
            Engine.elapsed = current - previous
            previous = current
            GPU.context.clear(GPU.context.COLOR_BUFFER_BIT | GPU.context.DEPTH_BUFFER_BIT)

            const transformationChanged = EntityWorkerAPI.hasChangeBuffer[0]
            if (transformationChanged === 1)
                LightsAPI.packageLights(false, true)

            if (!Engine.benchmarkMode)
                Loop.#callback()
            else {
                BenchmarkAPI.track(BENCHMARK_KEYS.ALL)
                Loop.#benchmarkMode()
                BenchmarkAPI.endTrack(BENCHMARK_KEYS.ALL)
            }

            if (transformationChanged === 1)
                EntityWorkerAPI.hasChangeBuffer[0] = 0

            CameraAPI.syncThreads()
            CameraAPI.updateUBOs()

            EntityWorkerAPI.syncThreads()

            Engine.frameID = requestAnimationFrame(Loop.loop)
        } catch (err) {
            console.error(err)
        }
    }
}