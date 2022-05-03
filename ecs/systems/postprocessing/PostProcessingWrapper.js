import System from "../../basic/System";
import Shader from "../../../utils/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import Bloom from "./Bloom";
import FXAA from "./FXAA";


export default class PostProcessingWrapper extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.bloomSystem = new Bloom(gpu)
        this.fxaaSystem = new FXAA(gpu)
    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()
        const {fxaa, bloom} = options


        let worker = a, output = b
        if(bloom) {
            this.bloomSystem.execute(options, systems, data, entities, entitiesMap, [worker, output])
            worker = b
            output = a
        }

        if(fxaa) {
            this.fxaaSystem.execute(options, [worker, output])
            const cache = output
            output = worker
            worker = cache
        }

        this.FSRShader.use()
        this.FSRShader.bindForUse({
            uSampler: worker.colors[0]
        })
        output.draw()

        // this.shader.use()
        // this.shader.bindForUse({
        //     uSampler: a.colors[0],
        //
        //     FXAASpanMax: 8,
        //     FXAAReduceMin: 1 / 128,
        //     inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
        //     FXAAReduceMul: 1 / 8
        // })
        // a.draw()
    }
}