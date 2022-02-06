import Shader from "../../Shader";
import vertex from 'raw-loader!./resources/deferredVertex.glsl'
import fragment from 'raw-loader!./resources/deferredFragment.glsl'
import {bindTexture} from "../../../utils/utils";

export default class DeferredShader extends Shader {
    constructor(gpu) {
        super(vertex, fragment, gpu);
        this.positionLocation = gpu.getAttribLocation(this.program, 'position')

        this.gPositionULocation = gpu.getUniformLocation(this.program, 'positionSampler')
        this.gNormalULocation = gpu.getUniformLocation(this.program, 'normalSampler')
        this.gAlbedoULocation = gpu.getUniformLocation(this.program, 'albedoSampler')
        this.gBehaviourULocation = gpu.getUniformLocation(this.program, 'behaviourSampler')

        this.lightQuantityULocation = gpu.getUniformLocation(this.program, 'lightQuantity')

        this.irradianceMapULocation = gpu.getUniformLocation(this.program, 'irradianceMap')
        this.prefilteredMapUlocation = gpu.getUniformLocation(this.program, 'prefilteredMapSampler')
        this.brdfULocation = gpu.getUniformLocation(this.program, 'brdfSampler')

        this.cameraVecULocation = gpu.getUniformLocation(this.program, 'cameraVec')
        this.directionalLightQuantity = gpu.getUniformLocation(this.program, 'dirLightQuantity')


        // SHADOWS
        this.shadowMapResolutionULocation = gpu.getUniformLocation(this.program, 'shadowMapResolution')
        this.shadowMapAtlasULocation = this.gpu.getUniformLocation(this.program, `shadowMapTexture`)
        this.shadowMapsQuantityULocation = this.gpu.getUniformLocation(this.program, `shadowMapsQuantity`)

    }

    bindUniforms({
                     directionalLights, shadowMap, irradianceMap,
                     shadowMapResolution, lights, shadowMapsQuantity,
                     gNormalTexture, gPositionTexture, gAlbedo,
                     gBehaviorTexture, cameraVec,
                     BRDF, closestCubeMap
                 }) {

        this.gpu.uniform3fv(this.cameraVecULocation, cameraVec)
        // DIRECTIONAL LIGHTS

        let maxTextures = directionalLights.length > 2 ? 2 : directionalLights.length


        this.gpu.uniform1i(this.directionalLightQuantity, maxTextures)
        for (let i = 0; i < maxTextures; i++) {
            const current = {
                direction: directionalLights[i].direction,
                ambient: directionalLights[i].color,
                face: directionalLights[i].atlasFace,
                lightViewMatrix: directionalLights[i].lightView,
                lightProjectionMatrix: directionalLights[i].lightProjection
            }


            const lightViewMatrix = this.gpu.getUniformLocation(this.program, `directionalLightsPOV[${i}].lightViewMatrix`)
            const lightProjectionMatrix = this.gpu.getUniformLocation(this.program, `directionalLightsPOV[${i}].lightProjectionMatrix`)
            this.gpu.uniformMatrix4fv(lightViewMatrix, false, current.lightViewMatrix)
            this.gpu.uniformMatrix4fv(lightProjectionMatrix, false, current.lightProjectionMatrix)

            const direction = this.gpu.getUniformLocation(this.program, `directionalLights[${i}].direction`)
            const ambient = this.gpu.getUniformLocation(this.program, `directionalLights[${i}].ambient`)

            const atlasFace = this.gpu.getUniformLocation(this.program, `directionalLights[${i}].atlasFace`)

            this.gpu.uniform2fv(atlasFace, current.face)
            this.gpu.uniform3fv(direction, current.direction)
            this.gpu.uniform3fv(ambient, current.ambient)
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
        bindTexture(0, gPositionTexture, this.gPositionULocation, this.gpu)
        bindTexture(1, gNormalTexture, this.gNormalULocation, this.gpu)
        bindTexture(2, gAlbedo, this.gAlbedoULocation, this.gpu)
        bindTexture(3, gBehaviorTexture, this.gBehaviourULocation, this.gpu)


        // SKYBOX + IRRADIANCE
        this.gpu.activeTexture(this.gpu.TEXTURE0 + 4)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, irradianceMap)
        this.gpu.uniform1i(this.irradianceMapULocation, 4)

        bindTexture(5, BRDF, this.brdfULocation, this.gpu)

        this.gpu.activeTexture(this.gpu.TEXTURE0 + 6)
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, closestCubeMap)
        this.gpu.uniform1i(this.prefilteredMapUlocation, 6)

        this.gpu.uniform1f(this.shadowMapResolutionULocation, shadowMapResolution)
        this.gpu.uniform1f(this.shadowMapsQuantityULocation, shadowMapsQuantity)
        bindTexture(7, shadowMap, this.shadowMapAtlasULocation, this.gpu)
    }

}