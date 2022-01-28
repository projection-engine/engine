import vertex from 'raw-loader!./resources/deferred/meshVertex.glsl'
import fragment from 'raw-loader!./resources/deferred/meshFragment.glsl'
import selectedVertex from 'raw-loader!./resources/selected/meshSelectedVertex.glsl'
import selectedFragment from 'raw-loader!./resources/selected/meshSelectedFragment.glsl'

import {bindTexture} from "../../../utils/utils";
import Shader from "../../Shader";

export default class MeshShader extends Shader {
    constructor(gpu, asSelected) {

        super(asSelected ? selectedVertex : vertex, asSelected ? selectedFragment :fragment, gpu);
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


    }

    bindUniforms({material, cameraVec, normalMatrix}) {

        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)
        this.gpu.uniformMatrix3fv(this.normalMatrixULocation, false, normalMatrix)

        if(!this.asSelected) {// TEXTURE PBR
            bindTexture(1, material.albedo.texture, this.materialAlbedoULocation, this.gpu)
            bindTexture(2, material.metallic.texture, this.materialMetallicULocation, this.gpu)
            bindTexture(3, material.roughness.texture, this.materialRoughnessULocation, this.gpu)
            bindTexture(4, material.normal.texture, this.materialNormalULocation, this.gpu)
            bindTexture(5, material.height.texture, this.materialHeightULocation, this.gpu)
            bindTexture(6, material.ao.texture, this.materialAOULocation, this.gpu)
        }
    }
}