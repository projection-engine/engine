import System from "../../basic/System"
import ShaderInstance from "../../instances/ShaderInstance"

import * as shaderCode from "../../shaders/FXAA.glsl"


export default class FinalPass extends System {
    lookUpRandom = []
    lookUpIndex = 0

    constructor() {
        super()
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        for (let i = 1e6; i > 0; i--) {
            this.lookUpRandom.push(Math.random())
        }
    }

    lookup() {
        return ++this.lookUpIndex >= this.lookUpRandom.length ? this.lookUpRandom[this.lookUpIndex = 0] : this.lookUpRandom[this.lookUpIndex]
    }

    execute(options, [worker, output]) {
        super.execute()
        const {
            fxaa,
            FXAASpanMax,
            FXAAReduceMin,
            FXAAReduceMul,
        } = options
        const {filmGrain, filmGrainStrength, gamma, exposure} = options.camera

        this.shader.use()
        this.shader.bindForUse({
            uSampler: worker.colors[0],
            enabled: [fxaa ? 1 : 0, filmGrain ? 1 : 0],
            settings: [FXAASpanMax, FXAAReduceMin, FXAAReduceMul, filmGrainStrength],
            colorGrading: [gamma, exposure, this.lookup()],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / window.gpu.drawingBufferWidth, 1 / window.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        output.draw()

    }
}