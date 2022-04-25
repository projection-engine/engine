import System from "../basic/System";
import Shader from "../../utils/workers/Shader";

import * as shaderCode from '../../shaders/misc/postProcessing.glsl'
import Bloom from "./postprocessing/Bloom";
import RENDERING_TYPES from "../../templates/RENDERING_TYPES";


export default class PostProcessingWrapper extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.bloomSystem = new Bloom(gpu)

    }

    execute(options, systems, data, entities, entitiesMap, [a, b]) {
        super.execute()

        const {
            typeRendering,
        } = options


        this.bloomSystem.execute(options, systems, data, entities, entitiesMap, [a, b])

        a.startMapping()
        this.FSRShader.use()
        this.FSRShader.bindForUse({
            uSampler: b.colors[0]
        })
        a.draw()
        a.stopMapping()


        this.shader.use()
        this.shader.bindForUse({
            uSampler: a.colors[0],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        a.draw()
    }
}