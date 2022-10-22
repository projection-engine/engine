import * as shaderCode from "../../../templates/shaders/FXAA.glsl"
import CameraAPI from "../../apis/CameraAPI";
import GPUResources from "../../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import GPUController from "../../../GPUController";


export default class CompositePass {
    static lookUpRandom = []
    static lookUpIndex = 0
    static workerTexture
    static shader

    static initialize() {
        CompositePass.shader =  GPUController.allocateShader(STATIC_SHADERS.PRODUCTION.FRAME_COMPOSITION, shaderCode.vertex, shaderCode.fragment)
        for (let i = 1e6; i > 0; i--)
            CompositePass.lookUpRandom.push(Math.random())
        CompositePass.workerTexture = GPUResources.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER).colors[0]
    }

    static lookup() {
        return ++CompositePass.lookUpIndex >= CompositePass.lookUpRandom.length ? CompositePass.lookUpRandom[CompositePass.lookUpIndex = 0] : CompositePass.lookUpRandom[CompositePass.lookUpIndex]
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

        CompositePass.shader.bindForUse({
            uSampler: CompositePass.workerTexture,
            enabled: [fxaa ? 1 : 0, filmGrain ? 1 : 0],
            settings: [FXAASpanMax, FXAAReduceMin, FXAAReduceMul, filmGrainStrength],
            colorGrading: [gamma, exposure, CompositePass.lookup()],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / window.gpu.drawingBufferWidth, 1 / window.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        GPUResources.quad.draw()

    }
}