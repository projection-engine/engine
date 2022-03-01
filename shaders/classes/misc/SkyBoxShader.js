import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/misc/skybox.glsl'


export default class SkyBoxShader extends Shader{
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'aPos')

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation =  gpu.getUniformLocation(this.program, 'projectionMatrix')
        this.textureULocation=  gpu.getUniformLocation(this.program, 'uTexture')

    }
}