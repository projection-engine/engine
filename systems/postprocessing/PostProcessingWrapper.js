import System from "../../basic/System";
import ShaderInstance from "../../instances/ShaderInstance";

import * as shaderCode from '../../shaders/FXAA.glsl'
import CompositePass from "./CompositePass";
import FinalPass from "./FinalPass";


export default class PostProcessingWrapper extends System {
    constructor(gpu, postProcessingResolution) {
        super([]);
        this.gpu = gpu
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        this.compositPass = new CompositePass(gpu, postProcessingResolution)
        this.finalPass = new FinalPass(gpu, postProcessingResolution)
    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()
        const {fsr} = options
        let worker = a, output = b

        this.compositPass.execute(options, systems, data, entities, entitiesMap, [worker, output])
        worker = b
        output = a

        this.finalPass.execute(options, [worker, output])
        const cache = output
        output = worker
        worker = cache

        this.shader.use()
        this.shader.bindForUse({
            uSampler: worker.colors[0],
            fsr: fsr ? 1 : 0
        })
        output.draw()
    }
}