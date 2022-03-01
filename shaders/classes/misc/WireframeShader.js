import {wireframeFragment, wireframeVertex} from '../../resources/mesh/meshDeferred.glsl'
import Shader from "../../../utils/workers/Shader";

export default class WireframeShader extends Shader {
    constructor(gpu) {

        super(wireframeVertex, wireframeFragment, gpu);
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
    }
    bindUniforms(){}
}