import {packageDirectionalLights, packagePointLights} from "../utils/package-lights";
import UBO from "../instances/UBO";
import ArrayBufferAPI from "./ArrayBufferAPI";

/**
 * "directionalLightsData" description (mat3 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 3 - 5: Light color
 * Indexes 6 - 7: Atlas faces
 * Index 8: hasShadowMap / PCF samples (if positive it has shadow map)
 */

/**
 * "settings" decomposition (vec4):
 * directionalLights, shadowMapResolution, shadowMapsQuantity, pointLights
 */

const MAX_POINT_LIGHT = 24, MAX_DIRECTIONAL_LIGHT = 16
let lightTimeout
export default class LightsAPI {
    static pointLightsUBO
    static directionalLightsUBO
    static #initialized = false
    static pointLightsBuffer = ArrayBufferAPI.allocateVector(MAX_POINT_LIGHT * 16, 0, false, false)
    static directionalLightsBuffer = ArrayBufferAPI.allocateVector(MAX_DIRECTIONAL_LIGHT * 16, 0, false, false)
    static directionalLightsPOVBuffer = ArrayBufferAPI.allocateVector(MAX_DIRECTIONAL_LIGHT * 16, 0, false, false)
    static directionalLightsQuantity = 0
    static pointLightsQuantity = 0

    static initialize() {
        if (LightsAPI.#initialized)
            return
        LightsAPI.#initialized = true
        LightsAPI.pointLightsUBO = new UBO(
            "PointLights",
            1,
            [

                {name: "pointLights", type: "mat4", dataLength: MAX_POINT_LIGHT},
                {name: "pointLightsQuantity", type: "int"},
            ]
        )
        LightsAPI.directionalLightsUBO = new UBO(
            "DirectionalLights",
            2,
            [

                {name: "directionalLights", type: "mat4", dataLength: MAX_DIRECTIONAL_LIGHT},
                {name: "directionalLightsPOV", type: "mat4", dataLength: MAX_DIRECTIONAL_LIGHT},

                {name: "directionalLightsQuantity", type: "int"},
            ]
        )
    }

    static packageLights(keepOld, force) {

        if (force) {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            LightsAPI.#updateUBO()
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => {
            packagePointLights(keepOld)
            packageDirectionalLights(keepOld)
            LightsAPI.#updateUBO()
        }, 50)

    }

    static #updateUBO() {
        LightsAPI.directionalLightsUBO.bind()
        LightsAPI.directionalLightsUBO.updateData("directionalLightsQuantity", new Uint8Array([Math.min(LightsAPI.directionalLightsQuantity, MAX_DIRECTIONAL_LIGHT)]))
        LightsAPI.directionalLightsUBO.updateData("directionalLightsPOV", LightsAPI.directionalLightsPOVBuffer)

        LightsAPI.directionalLightsUBO.updateData("directionalLights", LightsAPI.directionalLightsBuffer)
        LightsAPI.directionalLightsUBO.unbind()

        LightsAPI.pointLightsUBO.bind()
        LightsAPI.pointLightsUBO.updateData("pointLightsQuantity", new Uint8Array([Math.min(LightsAPI.pointLightsQuantity, MAX_POINT_LIGHT)]))
        LightsAPI.pointLightsUBO.updateData("pointLights", LightsAPI.pointLightsBuffer)
        LightsAPI.pointLightsUBO.unbind()
    }

}
