import COMPONENTS from "../static/COMPONENTS.js";
import {mat4} from "gl-matrix";
import Engine from "../Engine";
import OmnidirectionalShadows from "../runtime/rendering/OmnidirectionalShadows";
import DirectionalShadows from "../runtime/rendering/DirectionalShadows";
import LightsAPI from "./rendering/LightsAPI";


/**
 * "spotLights" description (mat4 array):
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

export function packageSpotLights(keepOld) {
    const spotLights = Engine.data.spotLights
    let buffer = LightsAPI.spotLightBuffer,
        size = 0,
        offset = 0

    if (!keepOld)
        for (let i = 0; i < LightsAPI.pointLightsBuffer.length; i++)
            LightsAPI.pointLightsBuffer[i] = 0

    for (let i = 0; i < spotLights.length; i++) {
        const current = spotLights[i]

        if (offset + 16 > buffer.length || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
            continue
        const component = current.components.get(COMPONENTS.POINT_LIGHT)

        const attenuation = component.attenuation
        const color = component.fixedColor
        const position = current.translation

        buffer[offset] = position[0]
        buffer[1 + offset] = position[1]
        buffer[2 + offset] = position[2]
        buffer[3 + offset] = component.shadowBias

        buffer[4 + offset] = color[0]
        buffer[5 + offset] = color[1]
        buffer[6 + offset] = color[2]
        buffer[7 + offset] = component.shadowSamples

        buffer[8 + offset] = attenuation[0]
        buffer[9 + offset] = attenuation[1]

        buffer[10 + offset] = component.outerCutoff

        buffer[11 + offset] = component.zNear
        buffer[12 + offset] = component.zFar
        buffer[13 + offset] = component.shadowMap ? 1 : 0
        buffer[14 + offset] = component.shadowAttenuationMinDistance
        buffer[15 + offset] = component.cutoff

        offset += 16

        if (component.shadowMap)
            OmnidirectionalShadows.lightsToUpdate.push(component)
        size++
    }


    LightsAPI.spotLightsQuantity = size
}

