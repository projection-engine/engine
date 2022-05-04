import System from "../basic/System";
import {SHADING_MODELS} from "../../pages/project/hooks/useSettings";
import SYSTEMS from "../templates/SYSTEMS";
import Shader from "../utils/Shader";
import * as shaderCode from '../shaders/mesh/deferred.glsl'
import * as shaderFlatCode from '../shaders/mesh/deferredFlat.glsl'

export default class DeferredSystem extends System {
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.deferredShader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.flatDeferredShader = new Shader(shaderFlatCode.vertex, shaderFlatCode.fragment, gpu)
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
            dirLights,
            dirLightsPov,
            lClip,
            lPosition,
            lColor,
            lAttenuation,
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

        const deferred = this._getDeferredShader(shadingModel)

        if(skylight)
            dirLights.push(skylight)

        deferred.use()
        deferred.bindForUse({
            positionSampler: deferredSystem.frameBuffer.colors[0],
            normalSampler: deferredSystem.frameBuffer.colors[1],
            albedoSampler: deferredSystem.frameBuffer.colors[2],
            behaviourSampler: deferredSystem.frameBuffer.colors[3],
            ambientSampler: deferredSystem.frameBuffer.colors[4],
            emissiveSampler: deferredSystem.frameBuffer.colors[5],

            cameraVec: camera.position,

            dirLightQuantity: maxTextures,
            directionalLights: dirLights,
            directionalLightsPOV: dirLightsPov,

            lightQuantity: pointLightsQuantity,
            lightClippingPlane: lClip,
            lightPositionAndShadowMap: lPosition,
            lightColor: lColor,
            lightAttenuationFactors: lAttenuation,


            shadowMapResolution: shadowMapSystem?.maxResolution,
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            shadowMapsQuantity: shadowMapSystem ? (shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture) : undefined,

            redIndirectSampler: giFBO?.colors[0],
            greenIndirectSampler: giFBO?.colors[1],
            blueIndirectSampler: giFBO?.colors[2],

            indirectLightAttenuation: skylight?.attenuation,
            gridSize: giGridSize,
            noGI: giFBO !== undefined ? 0 : 1,

            shadowCube0: shadowMapSystem?.cubeMaps[0]?.texture,
            shadowCube1: shadowMapSystem?.cubeMaps[1]?.texture,

            gamma: gamma ? gamma : 1,
            exposure: exposure ? exposure : 2,
        })
        deferredSystem.frameBuffer.draw()
    }

}