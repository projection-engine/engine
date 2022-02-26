import Shader from "../../utils/workers/Shader";

import {fragment, vertex} from '../resources/grid.glsl'


export default class GridShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')

        this.typeULocation = gpu.getUniformLocation(this.program, 'cameraType')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')
    }
}