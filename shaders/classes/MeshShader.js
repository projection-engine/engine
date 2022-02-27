import {fragment, vertex} from '../resources/meshDeferred.glsl'
import * as selected from '../resources/meshSelected.glsl'


import {bindTexture} from "../../utils/misc/utils";
import Shader from "../../utils/workers/Shader";

export default class MeshShader extends Shader {
    constructor(gpu, asSelected) {

        super(asSelected ? selected.vertex : vertex, asSelected ? selected.fragment :fragment, gpu);
        this.asSelected = asSelected
        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')

        this.normalMatrixULocation = gpu.getUniformLocation(this.program, 'normalMatrix')


        this.materialAlbedoULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.albedo')
        this.materialMetallicULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.metallic')
        this.materialRoughnessULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.roughness')
        this.materialNormalULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.normal')
        this.materialHeightULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.height')
        this.materialAOULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.ao')

        this.cameraVecULocation = gpu.getUniformLocation(this.program, 'cameraVec')
        this.indexULocation = gpu.getUniformLocation(this.program, 'indexSelected')

        // PARALLAX
        this.hsULocation = gpu.getUniformLocation(this.program, 'heightScale')
        this.layersULocation = gpu.getUniformLocation(this.program, 'layers')
        this.parallaxEnabledULocation = gpu.getUniformLocation(this.program, 'parallaxEnabled')

    }

    bindUniforms({material, cameraVec, normalMatrix}) {

        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)
        this.gpu.uniformMatrix3fv(this.normalMatrixULocation, false, normalMatrix)

        if(!this.asSelected) {// TEXTURE PBR
            this.gpu.uniform1i(this.parallaxEnabledULocation, material.parallaxEnabled)
            this.gpu.uniform1f(this.hsULocation, material.parallaxHeightScale)
            this.gpu.uniform1f(this.layersULocation, material.parallaxLayers)

            bindTexture(1, material.albedo.texture, this.materialAlbedoULocation, this.gpu)
            bindTexture(2, material.metallic.texture, this.materialMetallicULocation, this.gpu)
            bindTexture(3, material.roughness.texture, this.materialRoughnessULocation, this.gpu)
            bindTexture(4, material.normal.texture, this.materialNormalULocation, this.gpu)
            bindTexture(5, material.height.texture, this.materialHeightULocation, this.gpu)
            bindTexture(6, material.ao.texture, this.materialAOULocation, this.gpu)
        }
    }
}