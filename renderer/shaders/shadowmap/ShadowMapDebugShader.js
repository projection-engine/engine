import Shader from "../../Shader";

import vertex from 'raw-loader!../shadowmap/resources/shadowDebugVertex.glsl'
import fragment from 'raw-loader!../shadowmap/resources/shadowDebugFragment.glsl'

export default class ShadowMapDebugShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = this.gpu.getAttribLocation(this.program, 'position')
        this.shadowMapULocation = this.gpu.getUniformLocation(this.program, 'uSampler')
    }
}