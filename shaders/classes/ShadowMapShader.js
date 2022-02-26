import Shader from "../../utils/workers/Shader";

import {fragment, vertex} from '../resources/shadow.glsl'

export default class ShadowMapShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation =  gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')

    }
}