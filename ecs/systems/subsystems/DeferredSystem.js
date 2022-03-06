import System from "../../basic/System";
import {SHADING_MODELS} from "../../../../../pages/project/hook/useSettings";
import brdfImg from "../../../../../static/brdf_lut.jpg";
import {createTexture} from "../../../utils/misc/utils";
import SYSTEMS from "../../../utils/misc/SYSTEMS";
import Shader from "../../../utils/workers/Shader";
import * as shaderCode from '../../../shaders/resources/mesh/deferred.glsl'
import * as shaderFlatCode from '../../../shaders/resources/mesh/deferredFlat.glsl'

export default class DeferredSystem extends System {
    constructor(gpu) {
        super([]);

        this.gpu = gpu

        this.deferredShader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.flatDeferredShader = new Shader(shaderFlatCode.vertex, shaderFlatCode.fragment, gpu)

        const brdf = new Image()
        brdf.src = brdfImg

        brdf.onload = () => {
            this.BRDF = createTexture(
                gpu,
                512,
                512,
                gpu.RGBA32F,
                0,
                gpu.RGBA,
                gpu.FLOAT,
                brdf,
                gpu.LINEAR,
                gpu.LINEAR,
                gpu.CLAMP_TO_EDGE,
                gpu.CLAMP_TO_EDGE
            )
        }
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
            positionSampler: deferredSystem.gBuffer.gPositionTexture,
            normalSampler: deferredSystem.gBuffer.gNormalTexture,
            albedoSampler: deferredSystem.gBuffer.gAlbedo,
            behaviourSampler: deferredSystem.gBuffer.gBehaviorTexture,
            lightQuantity: pointLightsQuantity,
            irradianceMap: skyboxElement?.irradianceMap,
            prefilteredMapSampler: skyboxElement?.cubeMapPrefiltered,
            brdfSampler: this.BRDF,
            cameraVec: camera.position,
            dirLightQuantity: maxTextures,
            // previousFrameSampler
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
            lightPosition: (new Array(pointLightsQuantity).fill(null)).map((_, i) =>  pointLights[i].components.PointLightComponent.position),
            lightColor: (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.fixedColor),
            lightAttenuationFactors: (new Array(pointLightsQuantity).fill(null)).map((_, i) => pointLights[i].components.PointLightComponent.attenuation),
            shadowMapResolution: shadowMapSystem?.maxResolution,
            shadowMapTexture: shadowMapSystem?.shadowMapAtlas.frameBufferTexture,
            shadowMapsQuantity: shadowMapSystem ? (shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture) : undefined,
            redIndirectSampler: giFBO?.redTexture,
            greenIndirectSampler: giFBO?.greenTexture,
            blueIndirectSampler: giFBO?.blueTexture,
            indirectLightAttenuation: skylight?.attenuation,
            gridSize: giGridSize,
            noGI: giFBO !== undefined ? 0 : 1
        })

        deferredSystem.gBuffer.draw(deferred)

    }

}