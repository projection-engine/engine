import UBO from "../../instances/UBO";
import ArrayBufferAPI from "../utils/ArrayBufferAPI";
import packageDirectionalLights from "../package-directional-lights";
import packagePointLights from "../package-point-lights";
import {packageSpotLights} from "../package-spot-lights";

/**
 * "directionalLightsData" description (mat3 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 3 - 5: Light color
 * Indexes 6 - 7: Atlas faces
 * Index 8: hasShadowMap / PCF samples (if positive it has shadow map)
 */


const MAX_POINT_LIGHT = 24, MAX_DIRECTIONAL_LIGHT = 16, MAX_SPOTLIGHTS = 24
let lightTimeout
export default class LightsAPI {
    static pointLightsUBO
    static directionalLightsUBO
    static #initialized = false

    static spotLightBuffer = ArrayBufferAPI.allocateVector(MAX_SPOTLIGHTS * 16, 0, false, false)
    static spotLightsQuantity = 0

    static pointLightsBuffer = ArrayBufferAPI.allocateVector(MAX_POINT_LIGHT * 16, 0, false, false)
    static pointLightsQuantity = 0

    static directionalLightsBuffer = ArrayBufferAPI.allocateVector(MAX_DIRECTIONAL_LIGHT * 16, 0, false, false)
    static directionalLightsQuantity = 0

    static directionalLightsPOVBuffer = ArrayBufferAPI.allocateVector(MAX_DIRECTIONAL_LIGHT * 16, 0, false, false)



    static initialize() {
        if (LightsAPI.#initialized)
            return
        LightsAPI.#initialized = true
        LightsAPI.pointLightsUBO = new UBO(
            "PointLights",
            [

                {name: "pointLights", type: "mat4", dataLength: MAX_POINT_LIGHT},
                {name: "pointLightsQuantity", type: "int"},
            ]
        )
        LightsAPI.directionalLightsUBO = new UBO(
            "DirectionalLights",
            [
                {name: "directionalLights", type: "mat4", dataLength: MAX_DIRECTIONAL_LIGHT},
                {name: "directionalLightsPOV", type: "mat4", dataLength: MAX_DIRECTIONAL_LIGHT},
                {name: "directionalLightsQuantity", type: "int"},
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
            ]
        )
        LightsAPI.spotLightsUBO = new UBO(
            "SpotLights",
            [
                {name: "spotLights", type: "mat4", dataLength: MAX_SPOTLIGHTS},
                {name: "spotLightsQuantity", type: "int"}
            ]
        )
    }

    static packageLights(keepOld, force) {

        if (force) {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            packageSpotLights(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            packageSpotLights(keepOld)
        }, 50)

    }

    static updateDirectionalLightsBuffer(){
        LightsAPI.directionalLightsUBO.bind()
        LightsAPI.directionalLightsUBO.updateData("directionalLightsQuantity", new Uint8Array([Math.min(LightsAPI.directionalLightsQuantity, MAX_DIRECTIONAL_LIGHT)]))
        LightsAPI.directionalLightsUBO.updateData("directionalLightsPOV", LightsAPI.directionalLightsPOVBuffer)
        LightsAPI.directionalLightsUBO.updateData("directionalLights", LightsAPI.directionalLightsBuffer)
        LightsAPI.directionalLightsUBO.unbind()
    }

    static updatePointLightsBuffer(){

        LightsAPI.pointLightsUBO.bind()
        LightsAPI.pointLightsUBO.updateData("pointLightsQuantity", new Uint8Array([Math.min(LightsAPI.pointLightsQuantity, MAX_POINT_LIGHT)]))
        LightsAPI.pointLightsUBO.updateData("pointLights", LightsAPI.pointLightsBuffer)
        LightsAPI.pointLightsUBO.unbind()
    }
    static updateSpotLightsBuffer(){
        LightsAPI.spotLightsUBO.bind()
        LightsAPI.spotLightsUBO.updateData("spotLightsQuantity", new Uint8Array([Math.min(LightsAPI.spotLightsQuantity, MAX_SPOTLIGHTS)]))
        LightsAPI.spotLightsUBO.updateData("spotLights", LightsAPI.spotLightBuffer)
        LightsAPI.spotLightsUBO.unbind()
    }


}
