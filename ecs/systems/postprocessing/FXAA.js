import System from "../../basic/System";
import Shader from "../../../utils/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import Bloom from "./Bloom";


export default class FXAA extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
    }

    execute(options, [worker, output]) {
        super.execute()

        this.shader.use()
        output.startMapping()
        this.shader.bindForUse({
            uSampler: worker.colors[0],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        output.draw()
        output.stopMapping()
    }
}