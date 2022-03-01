import Shader from "../../../utils/workers/Shader";

import {debugFragment, debugVertex} from '../../resources/shadows/shadow.glsl'

export default class ShadowMapDebugShader extends Shader{
    constructor(gpu) {
        super(debugVertex, debugFragment, gpu);

        this.positionLocation = this.gpu.getAttribLocation(this.program, 'position')
        this.shadowMapULocation = this.gpu.getUniformLocation(this.program, 'uSampler')
    }
}