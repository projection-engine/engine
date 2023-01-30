import SSGI from "./runtime/SSGI";
import DirectionalShadows from "./runtime/DirectionalShadows";

import executeScripts from "./runtime/execute-scripts";
import LensPostProcessing from "./runtime/LensPostProcessing";
import FrameComposition from "./runtime/FrameComposition";

import Engine from "./Engine";
import Physics from "./runtime/Physics";
import EntityWorkerAPI from "./lib/utils/EntityWorkerAPI";
import OmnidirectionalShadows from "./runtime/OmnidirectionalShadows";
import CameraAPI from "./lib/utils/CameraAPI";
import MetricsController from "./lib/utils/MetricsController";

import VisibilityRenderer from "./runtime/VisibilityRenderer";
import LightsAPI from "./lib/utils/LightsAPI";
import SceneComposition from "./runtime/SceneComposition";
import GPU from "./GPU";
import GPUAPI from "./lib/rendering/GPUAPI";
import StaticFBO from "./lib/StaticFBO";

let previous = 0

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



    static #callback() {
        MetricsController.init()
        if (!Engine.isDev)
            executeScripts()
        Physics.execute()
        DirectionalShadows.execute()
        OmnidirectionalShadows.execute()
        VisibilityRenderer.execute()

        SceneComposition.execute()
        Loop.copyToCurrentFrame()

        SSGI.execute()
        LensPostProcessing.execute()
        FrameComposition.execute()

        MetricsController.end()

        Loop.#afterDrawing()
    }


    static loop(current) {
        try {
            Engine.elapsed = current - previous
            previous = current

            CameraAPI.updateUBOs()

            GPU.context.clear(GPU.context.COLOR_BUFFER_BIT | GPU.context.DEPTH_BUFFER_BIT)
            const transformationChanged = EntityWorkerAPI.hasChangeBuffer[0]
            if (transformationChanged === 1)
                LightsAPI.packageLights(false, true)
            Loop.#callback()
            if (transformationChanged === 1)
                EntityWorkerAPI.hasChangeBuffer[0] = 0


            CameraAPI.syncThreads()
            EntityWorkerAPI.syncThreads()
            Engine.frameID = requestAnimationFrame(Loop.loop)
        } catch (err) {
            console.error(err)
        }
    }
}