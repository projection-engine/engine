import ShaderInstance from "../../instances/ShaderInstance"

import * as shaderCode from "../../../data/shaders/FXAA.glsl"
import Renderer from "../../../Renderer";


export default class FinalPass{
    lookUpRandom = []
    lookUpIndex = 0
    workerTexture
    output

    constructor(workerTexture, output) {
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        for (let i = 1e6; i > 0; i--) {
            this.lookUpRandom.push(Math.random())
        }
        this.workerTexture = workerTexture
        this.output = output
    }

    lookup() {
        return ++this.lookUpIndex >= this.lookUpRandom.length ? this.lookUpRandom[this.lookUpIndex = 0] : this.lookUpRandom[this.lookUpIndex]
    }

    execute() {
        const {
            fxaa,
            FXAASpanMax,
            FXAAReduceMin,
            FXAAReduceMul,
            camera
        } = Renderer.params
        const {filmGrain, filmGrainStrength, gamma, exposure} = camera

        this.shader.use()
        this.shader.bindForUse({
            uSampler: this.workerTexture,
            enabled: [fxaa ? 1 : 0, filmGrain ? 1 : 0],
            settings: [FXAASpanMax, FXAAReduceMin, FXAAReduceMul, filmGrainStrength],
            colorGrading: [gamma, exposure, this.lookup()],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / window.gpu.drawingBufferWidth, 1 / window.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        this.output.draw()

    }
}