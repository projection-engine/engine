import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";

export default class FrameComposition {
    static lookUpRandom = []
    static lookUpIndex = 0
    static workerTexture
    static shader

    static initialize() {
        for (let i = 1e6; i > 0; i--)
            FrameComposition.lookUpRandom.push(Math.random())
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

        FrameComposition.shader.bindForUse({
            uSampler: FrameComposition.workerTexture,
            enabled: [fxaa ? 1 : 0, filmGrain ? 1 : 0],
            settings: [FXAASpanMax, FXAAReduceMin, FXAAReduceMul, filmGrainStrength],
            colorGrading: [gamma, exposure, FrameComposition.lookup()],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / gpu.drawingBufferWidth, 1 / gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        GPUResources.quad.draw()

    }
}