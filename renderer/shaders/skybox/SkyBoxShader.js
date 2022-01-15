import Shader from "../Shader";

import vertex from 'raw-loader!./resources/skyboxVertex.glsl'
import fragment from 'raw-loader!./resources/skyboxFragment.glsl'


export default class SkyBoxShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'aPos')

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')

    }
}