import Shader from "../../../Shader";
import vertex from 'raw-loader!./resources/deferredVertex.glsl'
import fragment from 'raw-loader!./resources/deferredFragment.glsl'
import {bindTexture} from "../../../../utils/utils";

export default class DeferredShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);

        this.positionLocation = gpu.getAttribLocation(this.program, 'position')
        this.lightViewMatrixULocation = gpu.getUniformLocation(this.program, 'lightViewMatrix')
        this.lightProjectionMatrixULocation = gpu.getUniformLocation(this.program, 'lightProjectionMatrix')

        this.gPositionULocation = gpu.getUniformLocation(this.program, 'positionSampler')
        this.gNormalULocation = gpu.getUniformLocation(this.program, 'normalSampler')
        this.gAlbedoULocation = gpu.getUniformLocation(this.program, 'albedoSampler')
        this.gBehaviourULocation = gpu.getUniformLocation(this.program, 'behaviourSampler')

        this.shadowMapResolutionULocation = gpu.getUniformLocation(this.program, 'shadowMapResolution')
        this.lightQuantityULocation = gpu.getUniformLocation(this.program, 'lightQuantity')
        this.shadowMapULocation = gpu.getUniformLocation(this.program, 'shadowMap')
        this.irradianceMapULocation = gpu.getUniformLocation(this.program, 'irradianceMap')
        this.cubeMapULocation = gpu.getUniformLocation(this.program, 'cubeMap')

        this.cameraVecULocation = gpu.getUniformLocation(this.program, 'cameraVec')

        // DIRECTIONAL LIGHT
        this.directionLightULocation = gpu.getUniformLocation(this.program, 'dirLight.direction')
        this.specularLightULocation = gpu.getUniformLocation(this.program, 'dirLight.specular')
        this.ambientLightULocation = gpu.getUniformLocation(this.program, 'dirLight.ambient')
        this.diffuseLightULocation = gpu.getUniformLocation(this.program, 'dirLight.diffuse')
    }
    bindUniforms({
                     directionalLight, shadowMapTexture,irradianceMap,
                     skyboxTexture, shadowMapResolution, lights,
                     gNormalTexture, gPositionTexture, gAlbedo,
                     gBehaviorTexture,                      cameraVec
                 }){

        this.gpu.uniform1f(this.shadowMapResolutionULocation, shadowMapResolution)
        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)
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


        bindTexture(0, gPositionTexture, this.gPositionULocation, this.gpu)
        bindTexture(1, gNormalTexture, this.gNormalULocation, this.gpu)
        bindTexture(2, gAlbedo, this.gAlbedoULocation, this.gpu)
        bindTexture(3, gBehaviorTexture, this.gBehaviourULocation, this.gpu)
        bindTexture(4, shadowMapTexture, this.shadowMapULocation, this.gpu)


        this.gpu.activeTexture(this.gpu.TEXTURE0 + 5)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, irradianceMap)
        this.gpu.uniform1i(this.irradianceMapULocation, 5)

        this.gpu.activeTexture(this.gpu.TEXTURE0 + 6)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, skyboxTexture)
        this.gpu.uniform1i(this.cubeMapULocation, 6)
    }

}