import COMPONENTS from "../static/COMPONENTS.js";
import Engine from "../Engine";
import OmnidirectionalShadows from "../runtime/rendering/OmnidirectionalShadows";
import LightsAPI from "./rendering/LightsAPI";


/**
 * "pointLightData" description (mat4 array):
 *
 * Indexes 0 - 2: Light position
 * Index 3: shadow bias
 * Indexes 4 - 6: Light color
 * Index 7: Samples
 * Indexes 8 - 9: Attenuation
 * Index 10: outerCutoff
 * Index 11: zNear
 * Index 12: zFar
 * Index 13: hasShadowMap
 * Index 14: Shadow attenuation distance
 * Index 15: Cutoff radius
 */

export default function packagePointLights(keepOld) {
    const pointLights = LightsAPI.pointLights.array
    let pointLightData = LightsAPI.pointLightsBuffer,
        size = 0,
        offset = 0

    if (!keepOld)
        for (let i = 0; i < LightsAPI.pointLightsBuffer.length; i++)
            LightsAPI.pointLightsBuffer[i] = 0

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

        pointLightData[10 + offset] = component.outerCutoff

        pointLightData[11 + offset] = component.zNear
        pointLightData[12 + offset] = component.zFar
        pointLightData[13 + offset] = (component.shadowMap ? -1 : 1) * (component.hasSSS ? 2 : 1)
        pointLightData[14 + offset] = component.shadowAttenuationMinDistance
        pointLightData[15 + offset] = component.outerCutoff * component.smoothing

        offset += 16

        if (component.shadowMap)
            OmnidirectionalShadows.lightsToUpdate.push(component)
        size++
    }


    LightsAPI.pointLightsQuantity = size

        LightsAPI.updatePointLightsBuffer()
}

