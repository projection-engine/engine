import Shader from "../Shader";
import depthVertex from 'raw-loader!./resources/depthMapVertex.glsl'
import depthFragment from 'raw-loader!./resources/depthMapFragment.glsl'


export default class DepthMapShader extends Shader{
    constructor(gpu) {
        super( depthVertex,  depthFragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.textureULocation = gpu.getUniformLocation(this.program, 'uSampler')
    }
}