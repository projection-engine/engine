import COMPONENTS from "../static/COMPONENTS.js";
import {mat4} from "gl-matrix";
import Engine from "../Engine";
import OmnidirectionalShadows from "../lib/passes/OmnidirectionalShadows";
import DirectionalShadows from "../lib/passes/DirectionalShadows";
import DeferredPass from "../lib/passes/DeferredPass";


/**
 * "pointLightData" description (mat4 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 4 - 6: Light color
 * Indexes 8 - 10: Attenuation
 * Index 11: zNear
 * Index 12: zFar
 * Index 13: hasShadowMap
 */

export function packagePointLights(keepOld) {
    const pointLights = Engine.data.pointLights
    let pointLightData = keepOld ? Engine.data.pointLightData : [],
        activeOffset = 0
    if (!pointLightData)
        pointLightData = []

    if (pointLights)
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i]

            if (!current.active) {
                activeOffset++
                continue
            }

            if (!current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            const component = current.components.get(COMPONENTS.POINT_LIGHT)

            if (!pointLightData[i - activeOffset])
                pointLightData[i - activeOffset] = new Float32Array(16)
            const currentVector = pointLightData[i - activeOffset]
            const position = current.translation
            currentVector[0] = position[0]
            currentVector[1] = position[1]
            currentVector[2] = position[2]

            const color = component.fixedColor
            currentVector[4] = color[0]
            currentVector[5] = color[1]
            currentVector[6] = color[2]

            const attenuation = component.attenuation
            currentVector[8] = attenuation[0]
            currentVector[9] = attenuation[1]
            currentVector[10] = attenuation[2]
            currentVector[11] = component.zNear
            currentVector[12] =component.zFar
            currentVector[13] = component.shadowMap ? 1 : 0
            // [
            //     0, 1, 2, 3
            //     4, 5, 6, 7,
            //     8, 9, 10, 11,
            //     12, 13, 14, 15
            // ]
            currentVector[3] = component.shadowBias
            currentVector[7] = component.shadowSamples
            // currentVector[15] =
            OmnidirectionalShadows.lightsToUpdate.push(component)

        }


    Engine.data.pointLightsQuantity = pointLightData.length
    Engine.data.pointLightData = pointLightData
    DeferredPass.deferredUniforms.settings[3] = pointLightData.length
}


/**
 * "directionalLightsData" description (mat3 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 3 - 5: Light color
 * Indexes 6 - 7: Atlas faces
 * Index 8: hasShadowMap / PCF samples (if positive it has shadow map)
 */

export function packageDirectionalLights(keepOld) {
    let directionalLightsData = keepOld ? Engine.data.directionalLightsData : [],
        dirLightPOV = keepOld ? Engine.data.dirLightPOV : [],
        activeOffset = 0,
        directionalLights = Engine.data.directionalLights
    if (!directionalLightsData || !dirLightPOV) {
        directionalLightsData = []
        dirLightPOV = []
    }
    if (directionalLights)
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i]
            if (!current.active) {
                activeOffset++
                continue
            }

            if (!current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            current.needsLightUpdate = false
            const component = current.components.get(COMPONENTS.DIRECTIONAL_LIGHT)
            mat4.lookAt(component.lightView, component.__entity.translation, component.center, [0, 1, 0])
            mat4.ortho(component.lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)

            if (!directionalLightsData[i - activeOffset])
                directionalLightsData[i - activeOffset] = new Float32Array(9)

            const currentVector = directionalLightsData[i - activeOffset]
            const position = current.translation
            currentVector[0] = position[0]
            currentVector[1] = position[1]
            currentVector[2] = position[2]

            const color = component.fixedColor
            currentVector[3] = color[0]
            currentVector[4] = color[1]
            currentVector[5] = color[2]

            currentVector[6] = component.atlasFace[0]
            currentVector[7] = component.atlasFace[1]
            currentVector[8] = (component.shadowMap ? 1 : -1) * component.pcfSamples

            component.lightIndex = i - activeOffset
            if (!dirLightPOV[component.lightIndex])
                dirLightPOV[component.lightIndex] = new Float32Array(16)
            mat4.multiply(dirLightPOV[component.lightIndex], component.lightProjection, component.lightView)

            DirectionalShadows.lightsToUpdate.push(component)
        }

    Engine.data.directionalLightsQuantity = directionalLightsData.length
    Engine.data.directionalLightsData = directionalLightsData
    DeferredPass.deferredUniforms.settings[0] = directionalLightsData.length
    Engine.data.dirLightPOV = dirLightPOV
}