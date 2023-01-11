import SSGI from "./runtime/SSGI";
import DirectionalShadows from "./runtime/DirectionalShadows";

import executeScripts from "./runtime/execute-scripts";
import LensPostProcessing from "./runtime/LensPostProcessing";
import FrameComposition from "./runtime/FrameComposition";

import Engine from "./Engine";
import SceneRenderer from "./runtime/SceneRenderer";
import Physics from "./runtime/Physics";
import EntityWorkerAPI from "./lib/utils/EntityWorkerAPI";
import OmnidirectionalShadows from "./runtime/OmnidirectionalShadows";
import MotionBlur from "./runtime/MotionBlur";
import CameraAPI from "./lib/utils/CameraAPI";
import BenchmarkAPI from "./lib/utils/BenchmarkAPI";
import BENCHMARK_KEYS from "./static/BENCHMARK_KEYS";
import VisibilityRenderer from "./runtime/VisibilityRenderer";
import LightsAPI from "./lib/utils/LightsAPI";
import SceneComposition from "./runtime/SceneComposition";
import GPU from "./GPU";
import GPUAPI from "./lib/rendering/GPUAPI";
import StaticFBO from "./lib/StaticFBO";

let previous = 0
const timer = (flag: string, target: Function) => {
    BenchmarkAPI.track(flag)
    target()
    BenchmarkAPI.endTrack(flag)
}

export default class Loop {
    static #afterDrawing?: Function = () => null

    static linkToExecutionPipeline(after?: Function) {
        if (typeof after === "function") {
            Loop.#afterDrawing = after
        } else
            Loop.#afterDrawing = () => null
    }

    static copyToCurrentFrame() {
        GPUAPI.copyTexture(StaticFBO.postProcessing1, StaticFBO.postProcessing2, GPU.context.COLOR_BUFFER_BIT)
    }

    static #benchmarkMode() {
        FrameComposition.copyPreviousFrame()

        timer(BENCHMARK_KEYS.PHYSICS_PASS, Physics.execute)

        timer(BENCHMARK_KEYS.DIRECTIONAL_SHADOWS, DirectionalShadows.execute)

        timer(BENCHMARK_KEYS.OMNIDIRECTIONAL_SHADOWS, OmnidirectionalShadows.execute)

        timer(BENCHMARK_KEYS.VISIBILITY_BUFFER, VisibilityRenderer.execute)

        timer(BENCHMARK_KEYS.FORWARD_PASS, SceneComposition.execute)

        Loop.#afterDrawing()
        Loop.copyToCurrentFrame()

        timer(BENCHMARK_KEYS.SSGI, SSGI.execute)
        timer(BENCHMARK_KEYS.POST_PROCESSING, LensPostProcessing.execute)
        timer(BENCHMARK_KEYS.FRAME_COMPOSITION, FrameComposition.execute)
    }

    static #callback() {
        if (!Engine.isDev)
            executeScripts()
        FrameComposition.copyPreviousFrame()

        Physics.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()
        VisibilityRenderer.execute()

        SceneComposition.execute()
        Loop.#afterDrawing()
        Loop.copyToCurrentFrame()

        SSGI.execute()
        LensPostProcessing.execute()
        FrameComposition.execute()
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