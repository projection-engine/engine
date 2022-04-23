import System from "../basic/System";
import Shader from "../../utils/workers/Shader";

import * as shaderCode from '../../shaders/misc/postProcessing.glsl'
import Bloom from "./postprocessing/Bloom";


export default class PostProcessingWrapper extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.noFxaaShader = new Shader(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.bloomSystem = new Bloom(gpu)

    }

    execute(options, systems, data, entities, entitiesMap, sceneColor, quad) {
        super.execute()

        const {
            typeRendering,
        } = options


        this.bloomSystem.execute(options, systems, data, entities, entitiesMap, sceneColor)
        // let shaderToApply
        // switch (typeRendering) {
        //     case RENDERING_TYPES.FSR:
        //         shaderToApply = this.FSRShader
        //         break
        //     case RENDERING_TYPES.DEFAULT:
        //         shaderToApply = this.noFxaaShader
        //         break
        //     default:
        //         shaderToApply = this.shader
        //         break
        // }
        //
        // shaderToApply.use()
        // shaderToApply.bindForUse({
        //     uSampler: sceneColor,
        //
        //     FXAASpanMax: 8,
        //     FXAAReduceMin: 1 / 128,
        //     inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
        //     FXAAReduceMul: 1 / 8
        // })
        // quad.draw()
    }
}