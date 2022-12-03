import COMPONENTS from "../static/COMPONENTS.js";
import {vec3} from "gl-matrix";
import Engine from "../Engine";
import LightsAPI from "./rendering/LightsAPI";

const toRad = Math.PI/180

export function packageSpotLights(keepOld) {
    const spotLights = Engine.data.spotLights
    let buffer = LightsAPI.spotLightBuffer,
        size = 0,
        offset = 0

    if (!keepOld)
        for (let i = 0; i < LightsAPI.spotLightBuffer.length; i++)
            LightsAPI.spotLightBuffer[i] = 0

    for (let i = 0; i < spotLights.length; i++) {
        const current = spotLights[i]

        if (offset + 16 > buffer.length || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
            continue
        const component = current.components.get(COMPONENTS.SPOTLIGHT)

        const attenuation = component.attenuation
        const color = component.fixedColor
        const position = current._translation
        const direction = component.direction
        const rotatedDirection = vec3.transformQuat([], direction, current._rotationQuat)
        const radius = Math.cos(component.radius * toRad)

        buffer[offset] = position[0]
        buffer[1 + offset] = position[1]
        buffer[2 + offset] = position[2]

        buffer[4 + offset] = color[0]
        buffer[5 + offset] = color[1]
        buffer[6 + offset] = color[2]

        buffer[8 + offset] = rotatedDirection[0]
        buffer[9 + offset] = rotatedDirection[1]
        buffer[10 + offset] = rotatedDirection[2]

        buffer[12 + offset] = attenuation[0]
        buffer[13 + offset] = attenuation[1]

        buffer[14 + offset] = radius
        buffer[15 + offset] = component.hasSSS ? 1 : 0

        offset += 16

        size++
    }


    LightsAPI.spotLightsQuantity = size

    LightsAPI.updateSpotLightsBuffer()
}

