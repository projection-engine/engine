import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/gi/lightInjection.glsl'
import {bindTexture} from "../../../utils/misc/utils";


export default class LightInjectionShader extends Shader{

    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.rsmFluxULocation = gpu.getUniformLocation(this.program, 'u_rsm_flux')
        this.rsmWorldULocation = gpu.getUniformLocation(this.program, 'u_rsm_world_positions')
        this.rsmNormalsULocation = gpu.getUniformLocation(this.program, 'u_rsm_world_normals')
        this.rsmSizeULocation = gpu.getUniformLocation(this.program, 'u_rsm_size')
        this.gridSizeULocation = gpu.getUniformLocation(this.program, 'u_grid_size')
    }

    bindUniforms(rsmFlux, rsmWorld, rsmNormal, rsmSize, gridSize){

        this.gpu.uniform1i(this.rsmSizeULocation, rsmSize)
        this.gpu.uniform1i(this.gridSizeULocation, gridSize)

        bindTexture(0, rsmFlux, this.rsmFluxULocation, this.gpu)
        bindTexture(1, rsmWorld, this.rsmWorldULocation, this.gpu)
        bindTexture(2, rsmNormal, this.rsmNormalsULocation, this.gpu)
    }
}