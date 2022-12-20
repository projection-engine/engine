import GPU from "../GPU";
import UBO from "../instances/UBO";
import AA_METHODS from "../static/AA_METHODS";
import GPUAPI from "../lib/rendering/GPUAPI";
import StaticMeshes from "../lib/StaticMeshes";
import StaticFBO from "../lib/StaticFBO";
import StaticShaders from "../lib/StaticShaders";
import MotionBlur from "./MotionBlur";


export default class FrameComposition {
    static lookUpRandom = new Float32Array(2e+3)
    static lookUpIndex = 0
    static UBO?: UBO
    static currentNoise = 0
    static AAMethodInUse = AA_METHODS.DISABLED

    static initialize() {
        FrameComposition.UBO = new UBO(
            "CompositionSettings",
            [
                {type: "vec2", name: "inverseFilterTextureSize"},
                {type: "bool", name: "vignetteEnabled"},
                {type: "int", name: "AAMethod"},
                {type: "bool", name: "filmGrainEnabled"},
                {type: "float", name: "vignetteStrength"},
                {type: "float", name: "FXAASpanMax"},
                {type: "float", name: "FXAAReduceMin"},
                {type: "float", name: "FXAAReduceMul"},
                {type: "float", name: "filmGrainStrength"},
                {type: "float", name: "gamma"},
                {type: "float", name: "exposure"}
            ]
        )

        FrameComposition.UBO.bindWithShader(StaticShaders.composition.program)

        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("gamma", new Float32Array([2.2]))
        FrameComposition.UBO.updateData("exposure", new Float32Array([1]))
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([8.0]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([1.0 / 128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([1.0 / 8.0]))
        FrameComposition.UBO.updateData("inverseFilterTextureSize", new Float32Array([1 / GPU.internalResolution.w, 1 / GPU.internalResolution.h]))
        FrameComposition.UBO.unbind()

        for (let i = 0; i < FrameComposition.lookUpRandom.length; i++)
            FrameComposition.lookUpRandom[i] = Math.random()
    }

    static lookup() {
        return ++FrameComposition.lookUpIndex >= FrameComposition.lookUpRandom.length ? FrameComposition.lookUpRandom[FrameComposition.lookUpIndex = 0] : FrameComposition.lookUpRandom[FrameComposition.lookUpIndex]
    }

    static copyPreviousFrame() {
        if (FrameComposition.AAMethodInUse !== AA_METHODS.TAA)
            return
        GPUAPI.copyTexture(StaticFBO.cache, StaticFBO.currentFrame, GPU.context.COLOR_BUFFER_BIT)
    }

    static execute() {
        const context = GPU.context
        const sampler = MotionBlur.enabled ? StaticFBO.mbSampler : StaticFBO.cacheSampler
        const shader = StaticShaders.composition, uniforms = StaticShaders.compositionUniforms

        FrameComposition.currentNoise = FrameComposition.lookup()

        shader.bind()
        context.activeTexture(context.TEXTURE0)
        context.bindTexture(context.TEXTURE_2D, sampler)
        context.uniform1i(uniforms.currentFrame, 0)

        if (FrameComposition.AAMethodInUse === AA_METHODS.TAA) {
            context.activeTexture(context.TEXTURE1)
            context.bindTexture(context.TEXTURE_2D, StaticFBO.TAACacheSampler)
            context.uniform1i(uniforms.previousFrame, 1)
        }

        context.uniform1f(uniforms.filmGrainSeed, FrameComposition.currentNoise)
        StaticMeshes.drawQuad()

    }
}