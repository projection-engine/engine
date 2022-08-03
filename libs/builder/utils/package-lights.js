import COMPONENTS from "../../../data/COMPONENTS";
import {mat4} from "gl-matrix";

export function packagePointLights(renderer = window.renderer) {
    const pointLights = renderer.data.pointLights
    let pointLightsQuantity = 0,
        pointLightData = [],
        activeOffset = 0


    if (pointLights)
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i]
            if (!current.active) {
                activeOffset++
                continue
            }
            pointLightsQuantity++
            const component = current.components[COMPONENTS.POINT_LIGHT]

            if (!pointLightData[i - activeOffset])
                pointLightData[i - activeOffset] = new Float32Array(16)
            const currentVector = pointLightData[i - activeOffset]
            const position = current.components[COMPONENTS.TRANSFORM].position
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

            currentVector[11] = component.zFar
            currentVector[12] = component.zNear
            currentVector[13] = component.shadowMap ? 1 : 0
        }
    renderer.data.pointLightsQuantity = pointLightsQuantity
    renderer.data.pointLightData = pointLightData
}

export function packageDirectionalLights(renderer = window.renderer) {
    let maxTextures = 0,
        directionalLightsData = [],
        dirLightPOV = [],
        activeOffset = 0,
        directionalLights = renderer.data.directionalLights
    if (directionalLights)
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i]
            if (!current.active) {
                activeOffset++
                continue
            }
            maxTextures++
            const component = current.components[COMPONENTS.DIRECTIONAL_LIGHT]

            if (!directionalLightsData[i - activeOffset])
                directionalLightsData[i - activeOffset] = new Float32Array(9)
            const currentVector = directionalLightsData[i - activeOffset]
            const position = current.components[COMPONENTS.TRANSFORM].translation
            currentVector[0] = position[0]
            currentVector[1] = position[1]
            currentVector[2] = position[2]

            const color = component.fixedColor
            currentVector[3] = color[0]
            currentVector[4] = color[1]
            currentVector[5] = color[2]

            currentVector[6] = component.atlasFace[0]
            currentVector[7] = component.atlasFace[1]
            currentVector[8] = component.shadowMap ? 1 : 0
            if (!dirLightPOV[i - activeOffset])
                dirLightPOV[i - activeOffset] = new Float32Array(16)
            mat4.multiply(dirLightPOV[i - activeOffset], component.lightProjection, component.lightView)
        }
    renderer.data.maxTextures = maxTextures
    renderer.data.directionalLightsData = directionalLightsData
    renderer.data.dirLightPOV = dirLightPOV
}