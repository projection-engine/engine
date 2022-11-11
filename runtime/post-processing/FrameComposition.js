import GPU from "../../GPU";
import UBO from "../../instances/UBO";

let shader, uniforms
export default class FrameComposition {
    static lookUpRandom = []
    static lookUpIndex = 0
    static workerTexture
    static shader
    static debugFlag

    static UBO

    static initialize() {
        FrameComposition.UBO = new UBO(
            "CompositionSettings",
            [
                {type: "vec2", name: "inverseFilterTextureSize"},
                {type: "bool", name: "vignetteEnabled"},
                {type: "bool", name: "fxaaEnabled"},
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

        FrameComposition.UBO.bindWithShader(FrameComposition.shader.program)
        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("gamma", new Float32Array([2.2]))
        FrameComposition.UBO.updateData("exposure", new Float32Array([1]))
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([8.0]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([1.0/128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([1.0/8.0]))
        FrameComposition.UBO.updateData("inverseFilterTextureSize", new Float32Array([1 / GPU.internalResolution.w, 1 / GPU.internalResolution.h]))
        FrameComposition.UBO.unbind()
        for (let i = 1e6; i > 0; i--)
            FrameComposition.lookUpRandom.push(Math.random())
        FrameComposition.updateShader()
    }

    static updateShader() {
        shader = FrameComposition.shader
        uniforms = shader.uniformMap
    }

    static lookup() {
        return ++FrameComposition.lookUpIndex >= FrameComposition.lookUpRandom.length ? FrameComposition.lookUpRandom[FrameComposition.lookUpIndex = 0] : FrameComposition.lookUpRandom[FrameComposition.lookUpIndex]
    }

    static execute() {
        shader.bind()
        gpu.activeTexture(gpu.TEXTURE0)
        gpu.bindTexture(gpu.TEXTURE_2D, FrameComposition.workerTexture)
        gpu.uniform1i(uniforms.uSampler, 0)
        if(uniforms.debugFlag)
            gpu.uniform1i(uniforms.debugFlag, FrameComposition.debugFlag)
        else
            gpu.uniform1f(uniforms.filmGrainSeed, FrameComposition.lookup())
        drawQuad()

    }
}