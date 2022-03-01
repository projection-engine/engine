import Shader from "../../../utils/workers/Shader";

import {fragment, vertex} from '../../resources/gi/lightPropagation.glsl'
import {bindTexture} from "../../../utils/misc/utils";


export default class LightPropagationShader extends Shader{

    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.gridSizeULocation = gpu.getUniformLocation(this.program, 'u_grid_size')

        this.redULocation = gpu.getUniformLocation(this.program, 'u_red_contribution')
        this.greenULocation = gpu.getUniformLocation(this.program, 'u_green_contribution')
        this.blueULocation = gpu.getUniformLocation(this.program, 'u_blue_contribution')

        this.redGeometryULocation = gpu.getUniformLocation(this.program, 'u_red_geometry_volume')
        this.greenGeometryULocation = gpu.getUniformLocation(this.program, 'u_green_geometry_volume')
        this.blueGeometryULocation = gpu.getUniformLocation(this.program, 'u_blue_geometry_volume')

        this.firstIterationULocation = gpu.getUniformLocation(this.program, 'u_first_iteration')

    }

    bindUniforms(red, green, blue, rGeo, gGeo, bGeo, firstIt, gridSize){


        this.gpu.uniform1i(this.firstIterationULocation, firstIt ? 1 : 0)
        this.gpu.uniform1i(this.gridSizeULocation, gridSize)

        bindTexture(0, red, this.redULocation, this.gpu)
        bindTexture(1, green, this.greenULocation, this.gpu)
        bindTexture(2, blue, this.blueULocation, this.gpu)
        
        bindTexture(3, rGeo, this.redGeometryULocation, this.gpu)
        bindTexture(4, gGeo, this.greenGeometryULocation, this.gpu)
        bindTexture(5, bGeo, this.blueGeometryULocation, this.gpu)
    }
}