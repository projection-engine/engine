import GPU from "../GPU";
import AA_METHODS from "../static/AA_METHODS";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import StaticUBOs from "../lib/StaticUBOs";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";


export default class FrameComposition {
    static lookUpRandom = new Float32Array(2e+3)
    static lookUpIndex = 0
    static currentNoise = 0
    static AAMethodInUse = AA_METHODS.DISABLED

    static initialize() {
        StaticUBOs.frameCompositionUBO.bind()
        StaticUBOs.frameCompositionUBO.updateData("FXAASpanMax", new Float32Array([8.0]))
        StaticUBOs.frameCompositionUBO.updateData("FXAAReduceMin", new Float32Array([1.0 / 128.0]))
        StaticUBOs.frameCompositionUBO.updateData("FXAAReduceMul", new Float32Array([1.0 / 8.0]))
        StaticUBOs.frameCompositionUBO.updateData("inverseFilterTextureSize", new Float32Array([1 / GPU.internalResolution.w, 1 / GPU.internalResolution.h]))
        StaticUBOs.frameCompositionUBO.unbind()

        for (let i = 0; i < FrameComposition.lookUpRandom.length; i++)
            FrameComposition.lookUpRandom[i] = Math.random()
    }

    static lookup() {
        return ++FrameComposition.lookUpIndex >= FrameComposition.lookUpRandom.length ? FrameComposition.lookUpRandom[FrameComposition.lookUpIndex = 0] : FrameComposition.lookUpRandom[FrameComposition.lookUpIndex]
    }


    static execute() {
        MetricsController.currentState = METRICS_FLAGS.FRAME_COMPOSITION
        const context = GPU.context
        const shader = StaticShaders.composition, uniforms = StaticShaders.compositionUniforms

        FrameComposition.currentNoise = FrameComposition.lookup()

        shader.bind()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, StaticFBO.lensSampler)
        context.uniform1i(uniforms.currentFrame, 0)


        context.uniform1f(uniforms.filmGrainSeed, FrameComposition.currentNoise)
        StaticMeshes.drawQuad()

    }
}