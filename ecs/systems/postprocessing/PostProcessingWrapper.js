import System from "../../basic/System";
import Shader from "../../../utils/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import CompositPass from "./CompositPass";
import FinalPass from "./FinalPass";


export default class PostProcessingWrapper extends System {
    constructor(gpu, postProcessingResolution) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)
        this.compositPass = new CompositPass(gpu, postProcessingResolution)
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