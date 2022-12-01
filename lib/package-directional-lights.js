import COMPONENTS from "../static/COMPONENTS.js";
import {mat4} from "gl-matrix";
import Engine from "../Engine";
import OmnidirectionalShadows from "../runtime/rendering/OmnidirectionalShadows";
import DirectionalShadows from "../runtime/rendering/DirectionalShadows";
import LightsAPI from "./rendering/LightsAPI";


/**
 * "directionalLightsData" description (mat4 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 4 - 6: Light color
 * Indexes 8 - 9: Atlas faces
 * Index 10: hasShadowMap / PCF samples (if positive it has shadow map)
 * Index 12: Shadow bias
 * Index 13: Shadow attenuation distance
 */

export default function packageDirectionalLights(keepOld) {
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
        directionalLightsData[offset + 13] = component.shadowAttenuationMinDistance

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
}