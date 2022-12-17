import GPU from "../../lib/GPU";
import UBO from "../../instances/UBO";
import AA_METHODS from "../../static/AA_METHODS";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import GPUAPI from "../../lib/rendering/GPUAPI";
import Engine from "../../Engine";

let shader, uniforms
export default class FrameComposition {
    static lookUpRandom
    static lookUpIndex = 0
    static workerTexture
    static shader
    static UBO
    static currentNoise = 0
    static #cacheFBO
    static #sourceFBO
    static AAMethodInUse = AA_METHODS.DISABLED
    static #taaCacheSampler

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

        FrameComposition.#cacheFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.TAA_CACHE)
        FrameComposition.#taaCacheSampler = FrameComposition.#cacheFBO.colors[0]
        FrameComposition.UBO.bindWithShader(FrameComposition.shader.program)
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("gamma", new Float32Array([2.2]))
        FrameComposition.UBO.updateData("exposure", new Float32Array([1]))
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([8.0]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([1.0 / 128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([1.0 / 8.0]))
        FrameComposition.UBO.updateData("inverseFilterTextureSize", new Float32Array([1 / GPU.internalResolution.w, 1 / GPU.internalResolution.h]))
        FrameComposition.UBO.unbind()
        FrameComposition.lookUpRandom = new Float32Array(2e+3)
        for (let i = 0; i < FrameComposition.lookUpRandom.length; i++)
            FrameComposition.lookUpRandom[i] = Math.random()
        FrameComposition.updateShader()
    }

    static updateShader() {
        shader = FrameComposition.shader
        uniforms = shader.uniformMap
    }

    static lookup() {
        return ++FrameComposition.lookUpIndex >= FrameComposition.lookUpRandom.length ? FrameComposition.lookUpRandom[FrameComposition.lookUpIndex = 0] : FrameComposition.lookUpRandom[FrameComposition.lookUpIndex]
    }
    static copyPreviousFrame(){
        if(FrameComposition.AAMethodInUse !== AA_METHODS.TAA)
            return
        GPUAPI.copyTexture(FrameComposition.#cacheFBO, Engine.currentFrameFBO, gpu.COLOR_BUFFER_BIT)
    }

    static execute() {
        FrameComposition.currentNoise = FrameComposition.lookup()

        shader.bind()
        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, FrameComposition.workerTexture)
        gpu.uniform1i(uniforms.currentFrame, 0)

        if(FrameComposition.AAMethodInUse === AA_METHODS.TAA) {
            gpu.activeTexture(gpu.TEXTURE1)
            gpu.bindTexture(gpu.TEXTURE_2D, FrameComposition.#taaCacheSampler)
            gpu.uniform1i(uniforms.previousFrame, 1)
        }

        gpu.uniform1f(uniforms.filmGrainSeed, FrameComposition.currentNoise)
        drawQuad()

    }
}