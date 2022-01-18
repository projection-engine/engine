import Shader from "../../../Shader";

import vertex from 'raw-loader!./resources/cubeMapVertex.glsl'
import fragment from 'raw-loader!./resources/cubeMapFragment.glsl'
import irradianceFragment from 'raw-loader!./resources/irradianceFragment.glsl'

export default class CubeMapShader extends Shader {
    constructor(gpu, asIrradiance) {
        const currentFragment = asIrradiance ? irradianceFragment : fragment
        super(vertex, currentFragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
        this.equirectangularMapULocation = gpu.getUniformLocation(this.program, 'uSampler')
    }
}