import vertex from 'raw-loader!./resources/meshVertex.glsl'
import fragment from 'raw-loader!./resources/meshFragment.glsl'

import {bindTexture} from "../../../utils/utils";
import Shader from "../Shader";

export default class MeshShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.viewMatrixULocation = gpu.getUniformLocation(this.program, 'viewMatrix')
        this.transformMatrixULocation = gpu.getUniformLocation(this.program, 'transformMatrix')
        this.projectionMatrixULocation = gpu.getUniformLocation(this.program, 'projectionMatrix')

        this.normalMatrixULocation = gpu.getUniformLocation(this.program, 'normalMatrix')
        this.lightViewMatrixULocation = gpu.getUniformLocation(this.program, 'lightViewMatrix')
        this.lightProjectionMatrixULocation = gpu.getUniformLocation(this.program, 'lightProjectionMatrix')


        this.materialAlbedoULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.albedo')
        this.materialMetallicULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.metallic')
        this.materialRoughnessULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.roughness')
        this.materialNormalULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.normal')
        this.materialHeightULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.height')
        this.materialAOULocation = gpu.getUniformLocation(this.program, 'pbrMaterial.ao')

        this.cameraVecULocation = gpu.getUniformLocation(this.program, 'cameraVec')
        this.shadowMapULocation = gpu.getUniformLocation(this.program, 'shadowMap')
        this.shadowMapResolutionULocation = gpu.getUniformLocation(this.program, 'shadowMapResolution')
        this.lightQuantityULocation = gpu.getUniformLocation(this.program, 'lightQuantity')

        this.irradianceMapULocation = gpu.getUniformLocation(this.program, 'irradianceMap')
        this.cubeMapULocation = gpu.getUniformLocation(this.program, 'cubeMap')

        // DIRECTIONAL LIGHT
        this.directionLightULocation = gpu.getUniformLocation(this.program, 'dirLight.direction')
        this.specularLightULocation = gpu.getUniformLocation(this.program, 'dirLight.specular')
        this.ambientLightULocation = gpu.getUniformLocation(this.program, 'dirLight.ambient')
        this.diffuseLightULocation = gpu.getUniformLocation(this.program, 'dirLight.diffuse')
    }

    bindUniforms({
                     skyboxTexture, shadowMapResolution,
                     directionalLight, shadowMapTexture,
                     material, cameraVec, normalMatrix, lights,
                     irradianceMap
                 }) {
        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)
        this.gpu.uniformMatrix3fv(this.normalMatrixULocation, false, normalMatrix)
        this.gpu.uniform1f(this.shadowMapResolutionULocation, shadowMapResolution)



        // LIGHTS
        this.gpu.uniformMatrix4fv(this.lightViewMatrixULocation, false, directionalLight.lightView)
        this.gpu.uniformMatrix4fv(this.lightProjectionMatrixULocation, false, directionalLight.lightProjection)
        this.gpu.uniform3fv(this.directionLightULocation, directionalLight.direction)
        this.gpu.uniform3fv(this.specularLightULocation, directionalLight.specular)
        this.gpu.uniform3fv(this.ambientLightULocation, directionalLight.ambientColor)
        this.gpu.uniform3fv(this.diffuseLightULocation, directionalLight.diffuse)
        this.gpu.uniform1i(this.lightQuantityULocation, (lights.length > 4 ? 4 : lights.length))
        for (let i = 0; i < (lights.length > 4 ? 4 : lights.length); i++) {
            const l = lights[i]
            const location = this.gpu.getUniformLocation(this.program, `lightPosition[${i}]`)
            const locationColor = this.gpu.getUniformLocation(this.program, `lightColor[${i}]`)
            const locationAttenuation = this.gpu.getUniformLocation(this.program, `lightAttenuationFactors[${i}]`)

            this.gpu.uniform3fv(location, l.position)
            this.gpu.uniform3fv(locationColor, l.ambientColor)

            this.gpu.uniform3fv(locationAttenuation, l.attenuation)
        }

        bindTexture(0, shadowMapTexture, this.shadowMapULocation, this.gpu)

        // TEXTURE PBR
        bindTexture(1, material.albedo.texture, this.materialAlbedoULocation, this.gpu)
        bindTexture(2, material.metallic.texture, this.materialMetallicULocation, this.gpu)
        bindTexture(3, material.roughness.texture, this.materialRoughnessULocation, this.gpu)
        bindTexture(4, material.normal.texture, this.materialNormalULocation, this.gpu)
        bindTexture(5, material.height.texture, this.materialHeightULocation, this.gpu)
        bindTexture(6, material.ao.texture, this.materialAOULocation, this.gpu)

        this.gpu.activeTexture(this.gpu.TEXTURE0 + 7)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, irradianceMap)
        this.gpu.uniform1i(this.irradianceMapULocation, 7)
    }
}