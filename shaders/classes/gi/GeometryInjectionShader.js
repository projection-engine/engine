import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/gi/geometryInjection.glsl'
import {bindTexture} from "../../../utils/misc/utils";
import GlobalIlluminationSystem from "../../../ecs/systems/subsystems/gi/GlobalIlluminationSystem";


export default class GeometryInjectionShader extends Shader{

    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.lightDirectionULocation = gpu.getUniformLocation(this.program, 'u_light_direction')
        this.rsmFluxULocation = gpu.getUniformLocation(this.program, 'u_rsm_flux')
        this.rsmWorldULocation = gpu.getUniformLocation(this.program, 'u_rsm_world_positions')
        this.rsmNormalsULocation = gpu.getUniformLocation(this.program, 'u_rsm_world_normals')
        this.rsmSizeULocation = gpu.getUniformLocation(this.program, 'u_rsm_size')
        this.texelULocation = gpu.getUniformLocation(this.program, 'u_texture_size')
    }

    bindUniforms(lightDirection, rsmFlux, rsmWorld, rsmNormal, rsmSize, texel){
        this.gpu.uniform3fv(this.lightDirectionULocation, lightDirection)
        this.gpu.uniform1i(this.rsmSizeULocation, rsmSize)
        this.gpu.uniform1i(this.texelULocation, texel)

        bindTexture(0, rsmFlux, this.rsmFluxULocation, this.gpu)
        bindTexture(1, rsmWorld, this.rsmWorldULocation, this.gpu)
        bindTexture(2, rsmNormal, this.rsmNormalsULocation, this.gpu)
    }
}