import Shader from "../../utils/workers/Shader";
import {fragment, vertex} from '../resources/deferredFlat.glsl'
import {bindTexture} from "../../utils/misc/utils";

export default class FlatDeferredShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.gPositionULocation = gpu.getUniformLocation(this.program, 'positionSampler')
        this.gAlbedoULocation = gpu.getUniformLocation(this.program, 'albedoSampler')
    }

    bindUniforms({
                     gPositionTexture, gAlbedo
                 }) {
        bindTexture(0, gPositionTexture, this.gPositionULocation, this.gpu)
        bindTexture(1, gAlbedo, this.gAlbedoULocation, this.gpu)
    }

}