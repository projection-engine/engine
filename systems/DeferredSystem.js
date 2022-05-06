import System from "../basic/System";
import {SHADING_MODELS} from "../../pages/project/hooks/useSettings";
import SYSTEMS from "../templates/SYSTEMS";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/mesh/deferred.glsl'
import * as shaderFlatCode from '../shaders/mesh/deferredFlat.glsl'

export default class DeferredSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.flatDeferredShader = new ShaderInstance(shaderFlatCode.vertex, shaderFlatCode.fragment, gpu)
    }

    _getDeferredShader(shadingModel) {
        switch (shadingModel) {
            case SHADING_MODELS.FLAT:
                return this.flatDeferredShader
            case SHADING_MODELS.DETAIL:
                return this.deferredShader
            case SHADING_MODELS.WIREFRAME:
                return this.flatDeferredShader
            default:
                return this.deferredShader
        }
    }

    execute(options, systems, data, giGridSize, giFBO) {
        super.execute()
        const {
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData,
            skylight,
        } = data

        const {
            camera,
            gamma,
            exposure,
            shadingModel
        } = options
        super.execute()
        const shadowMapSystem = systems[SYSTEMS.SHADOWS],
            deferredSystem = systems[SYSTEMS.MESH]

        const mutableData = {shadowMapResolution: 1, shadowMapsQuantity: 1,  indirectLightAttenuation: 1}
        if (shadowMapSystem) {
            mutableData.shadowMapResolution = shadowMapSystem.maxResolution
            mutableData.shadowMapsQuantity = shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture
        }


        const deferred = this._getDeferredShader(shadingModel)

        if (skylight) {
            directionalLightsData.push(skylight)
            mutableData.indirectLightAttenuation = skylight?.attenuation
        }


        deferred.use()
        deferred.bindForUse({
            positionSampler: deferredSystem.frameBuffer.colors[0],
            normalSampler: deferredSystem.frameBuffer.colors[1],
            albedoSampler: deferredSystem.frameBuffer.colors[2],
            behaviourSampler: deferredSystem.frameBuffer.colors[3],
            ambientSampler: deferredSystem.frameBuffer.colors[4],
            emissiveSampler: deferredSystem.frameBuffer.colors[5],
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            redIndirectSampler: giFBO?.colors[0],
            greenIndirectSampler: giFBO?.colors[1],
            blueIndirectSampler: giFBO?.colors[2],
            shadowCube0: shadowMapSystem?.cubeMaps[0]?.texture,
            shadowCube1: shadowMapSystem?.cubeMaps[1]?.texture,

            cameraVec: camera.position,
            settings: [
                maxTextures, mutableData.shadowMapResolution, mutableData.indirectLightAttenuation,
                giGridSize ? giGridSize : 1,  giFBO ? 0 : 1, pointLightsQuantity,
                shadowMapSystem ? 0 : 1, mutableData.shadowMapsQuantity, 0
            ],
            directionalLightsData,
            dirLightPOV,
            pointLightData
        })
        deferredSystem.frameBuffer.draw()
    }

}