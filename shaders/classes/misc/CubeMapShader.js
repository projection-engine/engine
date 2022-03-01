import Shader from "../../../utils/workers/Shader";

import {fragment, irradiance, prefiltered, vertex} from '../../resources/misc/cubeMap.glsl'


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
            return irradiance
        case 2:
            return prefiltered
        default:
            return
    }
}