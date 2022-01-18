import Shader from "../../Shader";

import vertex from 'raw-loader!./resources/outlineVertex.glsl'
import fragment from 'raw-loader!./resources/outlineFragment.glsl'

export default class OutlineShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
    }

    bindUniforms(viewMatrix, projectionMatrix, transformationMatrix) {
        this.gpu.uniformMatrix4fv(this.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.uniformMatrix4fv(this.transformMatrixULocation, false, transformationMatrix)
    }
}