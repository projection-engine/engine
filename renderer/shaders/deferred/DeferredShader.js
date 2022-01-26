import Shader from "../../Shader";
import vertex from 'raw-loader!./resources/deferredVertex.glsl'
import fragment from 'raw-loader!./resources/deferredFragment.glsl'
import {bindTexture} from "../../../utils/utils";

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
        // this.previousFrameULocation = gpu.getUniformLocation(this.program, 'prevFrameSampler')


        this.lightQuantityULocation = gpu.getUniformLocation(this.program, 'lightQuantity')

        this.irradianceMapULocation = gpu.getUniformLocation(this.program, 'irradianceMap')
        this.cubeMapULocation = gpu.getUniformLocation(this.program, 'cubeMap')
        this.cameraVecULocation = gpu.getUniformLocation(this.program, 'cameraVec')


        // DIRECTIONAL LIGHT
        this.directionLightULocation = gpu.getUniformLocation(this.program, 'dirLight.direction')
        this.specularLightULocation = gpu.getUniformLocation(this.program, 'dirLight.specular')
        this.ambientLightULocation = gpu.getUniformLocation(this.program, 'dirLight.ambient')

        this.directionalLightQuantity = gpu.getUniformLocation(this.program, 'dirLightQuantity')
        // directionalLightsPOV
        // directionalLights
        this.shadowMapULocation = gpu.getUniformLocation(this.program, 'shadowMap')
        this.shadowMapResolutionULocation = gpu.getUniformLocation(this.program, 'shadowMapResolution')

    }

    bindUniforms({
                     directionalLights, shadowMaps, irradianceMap,
                     skyboxTexture, shadowMapResolution, lights,
                     gNormalTexture, gPositionTexture, gAlbedo,
                     gBehaviorTexture, cameraVec
                 }) {


        this.gpu.uniform1f(this.shadowMapResolutionULocation, shadowMapResolution)
        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)


        // DIRECTIONAL LIGHTS
        let textureOffset = directionalLights.length > 4 ? 4 : directionalLights.length

        this.gpu.uniform1i(this.directionalLightQuantity, textureOffset)
        for (let i = 0; i < textureOffset; i++) {
            const current = {
                direction: directionalLights[i].direction,
                ambient: directionalLights[i].color,
                shadowMap: shadowMaps[i],
                lightViewMatrix: directionalLights[i].lightView,
                lightProjectionMatrix: directionalLights[i].lightProjection
            }

            const lightViewMatrix = this.gpu.getUniformLocation(this.program, `directionalLightsPOV[${i}].lightViewMatrix`)
            const lightProjectionMatrix = this.gpu.getUniformLocation(this.program, `directionalLightsPOV[${i}].lightProjectionMatrix`)
            this.gpu.uniformMatrix4fv(lightViewMatrix, false, current.lightViewMatrix)
            this.gpu.uniformMatrix4fv(lightProjectionMatrix, false, current.lightProjectionMatrix)

            const direction = this.gpu.getUniformLocation(this.program, `directionalLights[${i}].direction`)
            const ambient = this.gpu.getUniformLocation(this.program, `directionalLights[${i}].ambient`)
            const shadowMap = this.gpu.getUniformLocation(this.program, `shadowMapTexture${i}`)

            this.gpu.uniform3fv(direction, current.direction)
            this.gpu.uniform3fv(ambient, current.ambient)


            bindTexture(i, current.shadowMap, shadowMap, this.gpu)
        }


        // POINT LIGHTS
        this.gpu.uniform1i(this.lightQuantityULocation, (lights.length > 4 ? 4 : lights.length))

        for (let i = 0; i < (lights.length > 4 ? 4 : lights.length); i++) {
            const l = lights[i].components.PointLightComponent

            const location = this.gpu.getUniformLocation(this.program, `lightPosition[${i}]`)
            const locationColor = this.gpu.getUniformLocation(this.program, `lightColor[${i}]`)
            const locationAttenuation = this.gpu.getUniformLocation(this.program, `lightAttenuationFactors[${i}]`)

            this.gpu.uniform3fv(location, l.position)
            this.gpu.uniform3fv(locationColor, l.color)
            this.gpu.uniform3fv(locationAttenuation, l.attenuation)
        }


        // G-BUFFER TEXTURES
        bindTexture(0 + textureOffset, gPositionTexture, this.gPositionULocation, this.gpu)
        bindTexture(1 + textureOffset, gNormalTexture, this.gNormalULocation, this.gpu)
        bindTexture(2 + textureOffset, gAlbedo, this.gAlbedoULocation, this.gpu)
        bindTexture(3 + textureOffset, gBehaviorTexture, this.gBehaviourULocation, this.gpu)


        // SKYBOX + IRRADIANCE
        this.gpu.activeTexture(this.gpu.TEXTURE0 + 4 + textureOffset)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, irradianceMap)
        this.gpu.uniform1i(this.irradianceMapULocation, 4 + textureOffset)

        this.gpu.activeTexture(this.gpu.TEXTURE0 + 5 + textureOffset)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, skyboxTexture)
        this.gpu.uniform1i(this.cubeMapULocation, 5 + textureOffset)
    }

}