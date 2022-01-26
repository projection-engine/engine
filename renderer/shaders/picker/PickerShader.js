import Shader from "../../Shader";
import vertex from 'raw-loader!./resources/pickerVertex.glsl'
import fragment from 'raw-loader!./resources/pickerFragment.glsl'

export default class PickerShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);


        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
        this.pickerULocation = gpu.getUniformLocation(this.program, 'uID')

    }

    bindUniforms({pickerID}) {

        this.gpu.uniform4fv(this.pickerULocation, [...pickerID, 1])
    }
}