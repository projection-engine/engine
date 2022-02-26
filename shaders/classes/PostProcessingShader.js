import Shader from "../../utils/workers/Shader";

import {fragment, noFxaaFragment, vertex} from '../resources/postProcessing.glsl'

export default class PostProcessingShader extends Shader {
    constructor(gpu, noFxaa) {
        super(vertex,noFxaa ? noFxaaFragment : fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.textureULocation = gpu.getUniformLocation(this.program, 'uSampler')

        // COLOR CORRECTION
        this.gammaULocation = gpu.getUniformLocation(this.program, 'gamma')
        this.exposureULocation = gpu.getUniformLocation(this.program, 'exposure')

        // FXAA
        this.FXAASpanMaxULocation = gpu.getUniformLocation(this.program, 'FXAASpanMax')
        this.FXAAReduceMinULocation = gpu.getUniformLocation(this.program, 'FXAAReduceMin')
        this.inverseFilterTextureSizeULocation = gpu.getUniformLocation(this.program, 'inverseFilterTextureSize')
        this.FXAAReduceMulULocation = gpu.getUniformLocation(this.program, 'FXAAReduceMul')
    }
}