import System from "../../basic/System";
import {SHADING_MODELS} from "../../../../../pages/project/hook/useSettings";
import brdfImg from "../../../../../static/brdf_lut.jpg";
import {createTexture} from "../../../utils/misc/utils";
import SYSTEMS from "../../../utils/misc/SYSTEMS";
import Shader from "../../../utils/workers/Shader";
import * as shaderCode from '../../../shaders/mesh/deferred.glsl'
import * as shaderFlatCode from '../../../shaders/mesh/deferredFlat.glsl'

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

    execute(skyboxElement, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems, giFBO, giGridSize, skylight) {
        super.execute()

        const shadowMapSystem = systems[SYSTEMS.SHADOWS],
            deferredSystem = systems[SYSTEMS.MESH]

        const deferred = this._getDeferredShader(shadingModel)
        let dirLights = directionalLights.map(d => d.components.DirectionalLightComponent)

        if(skylight)
            dirLights.push(skylight)


        deferred.use()
        let maxTextures = dirLights.length > 2 ? 2 : dirLights.length,
            pointLightsQuantity = (pointLights.length > 4 ? 4 : pointLights.length)
        deferred.bindForUse({
            positionSampler: deferredSystem.frameBuffer.colors[0],
            normalSampler: deferredSystem.frameBuffer.colors[1],
            albedoSampler: deferredSystem.frameBuffer.colors[2],
            behaviourSampler: deferredSystem.frameBuffer.colors[3],
            ambientSampler: deferredSystem.frameBuffer.colors[4],

            lightQuantity: pointLightsQuantity,
            cameraVec: camera.position,
            dirLightQuantity: maxTextures,
            directionalLights: (new Array(maxTextures).fill(null)).map((_, i) => {
                return {
                    direction: dirLights[i].direction,
                    ambient: dirLights[i].fixedColor,
                    atlasFace: dirLights[i].atlasFace
                }
            }),
            directionalLightsPOV: (new Array(maxTextures).fill(null)).map((_, i) => {
                return {
                    lightViewMatrix: dirLights[i].lightView,
                    lightProjectionMatrix: dirLights[i].lightProjection
                }
            }),
            lightClippingPlane: (new Array(pointLightsQuantity).fill(null)).map((_, i) =>  [pointLights[i].components.PointLightComponent.zNear, pointLights[i].components.PointLightComponent.zFar]),
            lightPosition: (new Array(pointLightsQuantity).fill(null)).map((_, i) =>  pointLights[i].components.PointLightComponent.position),
            lightColor: (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.fixedColor),
            lightAttenuationFactors: (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.attenuation),

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
        })
        deferredSystem.frameBuffer.draw()
    }

}