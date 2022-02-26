import Shader from "../../utils/workers/Shader";

import {fragment, vertex, fragmentBlur} from '../resources/ambientOcclusion.glsl'


export default class AOShader extends Shader{

    constructor(gpu, asBlur) {
        super(vertex, asBlur ? fragmentBlur : fragment, gpu);


        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.gPositionULocation = gpu.getUniformLocation(this.program, 'positionSampler')
        this.gNormalULocation = gpu.getUniformLocation(this.program, 'normalSampler')
        this.noiseULocation = gpu.getUniformLocation(this.program, 'noiseSampler')
        this.aoULocation = gpu.getUniformLocation(this.program, 'aoSampler')

        this.projectionULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
    }

}