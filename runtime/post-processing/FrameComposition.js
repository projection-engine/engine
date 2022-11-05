import CameraAPI from "../../api/CameraAPI";
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
        // FrameComposition.UBO = new UBO(
        //     "compositionSettings",
        //     0,
        //     [
        //         {type: "bool", name: "fxaaEnabled"},
        //         {type: "bool", name: "filmGrainEnabled"},
        //         {type: "float", name: "FXAASpanMax"},
        //         {type: "float", name: "FXAAReduceMin"},
        //         {type: "float", name: "FXAAReduceMul"},
        //         {type: "float", name: "filmGrainStrength"},
        //         {type: "float", name: "gamma"},
        //         {type: "float", name: "exposure"},
        //         {type: "vec2", name: "inverseFilterTextureSize"}
        //     ]
        // )
        // FrameComposition.UBO.bindWithShader(FrameComposition.shader.program)
        // FrameComposition.UBO.updateData("inverseFilterTextureSize", new Float32Array([1 / GPU.internalResolution.w, 1 / GPU.internalResolution.h]))

        for (let i = 1e6; i > 0; i--)
            FrameComposition.lookUpRandom.push(Math.random())
    }

    static updateShader() {
        shader = FrameComposition.shader
        uniforms = shader.uniforms
    }

    static lookup() {
        return ++FrameComposition.lookUpIndex >= FrameComposition.lookUpRandom.length ? FrameComposition.lookUpRandom[FrameComposition.lookUpIndex = 0] : FrameComposition.lookUpRandom[FrameComposition.lookUpIndex]
    }

    static execute() {
        const {
            filmGrain,
            filmGrainStrength,
            gamma,
            exposure,
            fxaa,
            FXAASpanMax,
            FXAAReduceMin,
            FXAAReduceMul
        } = CameraAPI.metadata

        shader.bindForUse({
            uSampler: FrameComposition.workerTexture,
            debugFlag: FrameComposition.debugFlag,


            enabled: [fxaa ? 1 : 0, filmGrain ? 1 : 0],
            settings: [FXAASpanMax, FXAAReduceMin, FXAAReduceMul, filmGrainStrength],
            colorGrading: [gamma, exposure, filmGrain ? FrameComposition.lookup() : 0],
            inverseFilterTextureSize: [1 / gpu.drawingBufferWidth, 1 / gpu.drawingBufferHeight, 0],

        })
        GPU.quad.draw()

    }
}