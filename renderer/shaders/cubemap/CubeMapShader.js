import Shader from "../../Shader";

import vertex from 'raw-loader!./resources/cubeMapVertex.glsl'
import fragment from 'raw-loader!./resources/cubeMapFragment.glsl'
import irradianceFragment from 'raw-loader!./resources/irradianceFragment.glsl'
import prefilteredFragment from 'raw-loader!./resources/prefilteredFragment.glsl'

export default class CubeMapShader extends Shader {
    constructor(gpu, type) {
        const currentFragment = getFragment(type)
        super(vertex, currentFragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')
        this.equirectangularMapULocation = gpu.getUniformLocation(this.program, 'uSampler')
    }
}

function getFragment(type) {
    switch (type) {
        case 0:
            return fragment
        case 1:
            return irradianceFragment
        case 2:
            return prefilteredFragment
        default:
            return
    }
}