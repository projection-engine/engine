import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/shadows/shadow.glsl'

export default class ShadowMapShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation =  gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')
        this.normalMatrixULocation =  gpu.getUniformLocation(this.program, 'normalMatrix')

        this.albedoULocation =  gpu.getUniformLocation(this.program, 'albedoSampler')
        this.normalULocation =  gpu.getUniformLocation(this.program, 'normalSampler')
        this.lightColorULocation =  gpu.getUniformLocation(this.program, 'lightColor')

    }
}