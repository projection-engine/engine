import System from "../../basic/System";
import Shader from "../../../utils/Shader";

import * as shaderCode from '../../../shaders/misc/postProcessing.glsl'
import Bloom from "./Bloom";
import FinalPass from "./FinalPass";


export default class PostProcessingWrapper extends System {
    constructor(gpu, postProcessingResolution) {
        super([]);
        this.gpu = gpu
        this.shader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)
        this.bloomPass = new Bloom(gpu, postProcessingResolution)
        this.finalPass = new FinalPass(gpu, postProcessingResolution)
    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()
        const {fsr, bloom} = options


        let worker = a, output = b
        if (bloom) {
            this.bloomPass.execute(options, systems, data, entities, entitiesMap, [worker, output])
            worker = b
            output = a
        }
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