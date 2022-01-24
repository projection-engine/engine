import Shader from "../../Shader";
import vertex from 'raw-loader!./resources/gridVertex.glsl'
import fragment from 'raw-loader!./resources/gridFragment.glsl'


export default class GridShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.transformationMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.colorULocation = gpu.getUniformLocation(this.program, 'color')
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')
    }
}