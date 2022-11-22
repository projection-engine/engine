import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import GBuffer from "./runtime/rendering/GBuffer";
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
        // TODO
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
        GPUAPI.copyTexture(FBO, VisibilityBuffer.buffer, gpu.DEPTH_BUFFER_BIT)

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