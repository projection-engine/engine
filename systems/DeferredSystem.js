import System from "../basic/System";

import SYSTEMS from "../templates/SYSTEMS";
import ShaderInstance from "../instances/ShaderInstance";
import * as shaderCode from '../shaders/mesh/DEFERRED.glsl'
import * as shaderFlatCode from '../shaders/debug/FLAT.glsl'
import SHADING_MODELS from "../templates/SHADING_MODELS";

export default class DeferredSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment, gpu)
        this.flatDeferredShader = new ShaderInstance(shaderFlatCode.vertex, shaderFlatCode.fragment, gpu)
    }

    _getDeferredShader(shadingModel) {
        switch (shadingModel) {
            case SHADING_MODELS.ALBEDO:
                return this.flatDeferredShader
            case SHADING_MODELS.DETAIL:
                return this.deferredShader
            default:
                return this.deferredShader
        }
    }

    execute(options, systems, data, giGridSize, giFBO) {
        super.execute()
        if (this.aoTexture === undefined && systems[SYSTEMS.AO])
            this.aoTexture = systems[SYSTEMS.AO].texture
        const {
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData,
            skylight,
        } = data

        const {
            ao,
            camera,
            shadingModel,
            pcfSamples
        } = options
        super.execute()
        const shadowMapSystem = systems[SYSTEMS.SHADOWS],
            deferredSystem = systems[SYSTEMS.MESH]

        const mutableData = {shadowMapResolution: 1, shadowMapsQuantity: 1, indirectLightAttenuation: 1}
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
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            redIndirectSampler: giFBO?.colors[0],
            greenIndirectSampler: giFBO?.colors[1],
            blueIndirectSampler: giFBO?.colors[2],

            aoSampler: this.aoTexture,

            shadowCube0: shadowMapSystem?.cubeMaps[0]?.texture,
            shadowCube1: shadowMapSystem?.cubeMaps[1]?.texture,

            cameraVec: camera.position,
            settings: [
                maxTextures, mutableData.shadowMapResolution, mutableData.indirectLightAttenuation, pcfSamples,
                giGridSize ? giGridSize : 1, giFBO ? 0 : 1, pointLightsQuantity, 0,
                shadowMapSystem ? 0 : 1, mutableData.shadowMapsQuantity, ao ? 1 : 0, 0,
                0, 0, 0, 0
            ],
            directionalLightsData,
            dirLightPOV,
            pointLightData
        })
        deferredSystem.frameBuffer.draw()
    }

}