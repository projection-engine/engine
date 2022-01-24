import Shader from "../../Shader";

import vertex from 'raw-loader!./resources/billboardVertex.glsl'
import fragment from 'raw-loader!./resources/billboardFragment.glsl'


export default class BillboardShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')


        this.cameraULocation = gpu.getUniformLocation(this.program, 'cameraPosition')
        this.imageULocation = gpu.getUniformLocation(this.program, 'iconSampler')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')
    }
}