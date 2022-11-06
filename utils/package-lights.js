import COMPONENTS from "../static/COMPONENTS.js";
import {mat4} from "gl-matrix";
import Engine from "../Engine";
import OmnidirectionalShadows from "../runtime/occlusion/OmnidirectionalShadows";
import DirectionalShadows from "../runtime/occlusion/DirectionalShadows";
import LightsAPI from "../api/LightsAPI";


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
    let pointLightData = LightsAPI.pointLightsBuffer,
        size = 0,
        offset = 0

    if (!keepOld)
        for (let i = 0; i < LightsAPI.pointLightsBuffer.length; i++)
            LightsAPI.pointLightsBuffer[i] = 0
    if (pointLights)
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i]

            if (offset + 16 > pointLightData.length || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            const component = current.components.get(COMPONENTS.POINT_LIGHT)


            const position = current.translation
            pointLightData[offset] = position[0]
            pointLightData[1 + offset] = position[1]
            pointLightData[2 + offset] = position[2]

            pointLightData[3 + offset] = component.shadowBias

            const color = component.fixedColor
            pointLightData[4 + offset] = color[0]
            pointLightData[5 + offset] = color[1]
            pointLightData[6 + offset] = color[2]

            pointLightData[7 + offset] = component.shadowSamples

            const attenuation = component.attenuation
            pointLightData[8 + offset] = attenuation[0]
            pointLightData[9 + offset] = attenuation[1]
            pointLightData[10 + offset] = attenuation[2]
            pointLightData[11 + offset] = component.zNear
            pointLightData[12 + offset] = component.zFar
            pointLightData[13 + offset] = component.shadowMap ? 1 : 0


            offset += 16

            if (component.shadowMap)
                OmnidirectionalShadows.lightsToUpdate.push(component)
            size++
        }


    LightsAPI.pointLightsQuantity = size
    Engine.data.pointLightsQuantity = size
    Engine.data.pointLightData = pointLightData
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
    let directionalLightsData = LightsAPI.directionalLightsBuffer,
        dirLightPOV = LightsAPI.directionalLightsPOVBuffer,
        offset = 0,
        directionalLights = Engine.data.directionalLights,
        size = 0

    if (!keepOld)
        for (let i = 0; i < LightsAPI.directionalLightsBuffer.length; i++) {
            LightsAPI.directionalLightsBuffer[i] = 0
            LightsAPI.directionalLightsPOVBuffer[i] = 0
        }

    if (directionalLights)
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i]

            if (offset + 16 > directionalLightsData.length || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            current.needsLightUpdate = false
            const component = current.components.get(COMPONENTS.DIRECTIONAL_LIGHT)

            const position = current.translation
            directionalLightsData[offset] = position[0]
            directionalLightsData[offset + 1] = position[1]
            directionalLightsData[offset + 2] = position[2]

            const color = component.fixedColor
            directionalLightsData[offset + 4] = color[0]
            directionalLightsData[offset + 5] = color[1]
            directionalLightsData[offset + 6] = color[2]

            directionalLightsData[offset + 8] = component.atlasFace[0]
            directionalLightsData[offset + 9] = component.atlasFace[1]
            directionalLightsData[offset + 10] = (component.shadowMap ? 1 : -1) * component.pcfSamples
            directionalLightsData[offset + 12] = component.shadowBias

            if (component.shadowMap) {
                mat4.lookAt(component.lightView, component.__entity._translation, component.center, [0, 1, 0])
                mat4.ortho(component.lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)

                const temp = mat4.multiply([], component.lightProjection, component.lightView)
                for (let i = 0; i < temp.length; i++)
                    dirLightPOV[offset + i] = temp[i]

                DirectionalShadows.lightsToUpdate.push(component)
            }

            offset += 16
            size++
        }

    LightsAPI.directionalLightsQuantity = size
    Engine.data.directionalLightsQuantity = size
}