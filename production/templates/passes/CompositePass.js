import ShaderInstance from "../../controllers/instances/ShaderInstance"

import * as shaderCode from "../../data/shaders/FXAA.glsl"
import CameraAPI from "../../libs/apis/CameraAPI";
import GPU from "../../controllers/GPU";
import STATIC_FRAMEBUFFERS from "../../../static/STATIC_FRAMEBUFFERS";


export default class CompositePass {
    static lookUpRandom = []
    static lookUpIndex = 0
    static workerTexture
    static shader

    static initialize() {
        CompositePass.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        for (let i = 1e6; i > 0; i--)
            CompositePass.lookUpRandom.push(Math.random())
        CompositePass.workerTexture = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.POST_PROCESSING_WORKER).colors[0]
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
        GPU.quad.draw()

    }
}