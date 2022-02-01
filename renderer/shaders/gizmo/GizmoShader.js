import vertex from 'raw-loader!./resources/gizmoVertex.glsl'
import fragment from 'raw-loader!./resources/gizmoFragment.glsl'
import Shader from "../../Shader";

export default class GizmoShader extends Shader {
    constructor(gpu) {

        super(vertex, fragment, gpu);

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')


    }

    bindUniforms() {}
}