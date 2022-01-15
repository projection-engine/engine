import Shader from "../Shader";

import vertex from 'raw-loader!./resources/shadowVertex.glsl'
import fragment from 'raw-loader!./resources/shadowFragment.glsl'

export default class ShadowMapShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation =  gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')

    }
}