import ArrayBufferAPI from "./ArrayBufferAPI";
import DynamicMap from "../../templates/DynamicMap";
import LIGHT_TYPES from "../../static/LIGHT_TYPES";
import {mat4, vec3} from "gl-matrix";
import DirectionalShadows from "../../runtime/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/OmnidirectionalShadows";
import type Entity from "../../instances/Entity";
import UberShader from "../../utils/UberShader";
import StaticUBOs from "../StaticUBOs";


let lightTimeout
const toRad = Math.PI / 180
const transformedNormalCache = vec3.create(),
    lightViewProjection = mat4.create()

const cacheVec3 = vec3.create()

export default class LightsAPI {

    static lights = new DynamicMap<Entity>()
    static primaryBuffer = <Float32Array>ArrayBufferAPI.allocateVector(UberShader.MAX_LIGHTS * 16, 0, false, false, false)
    static secondaryBuffer = <Float32Array>ArrayBufferAPI.allocateVector(UberShader.MAX_LIGHTS * 16, 0, false, false, false)
    static typeBuffer = <Uint8Array>ArrayBufferAPI.allocateVector(UberShader.MAX_LIGHTS, 0, false, false, true)
    static lightsQuantity = 0


    static packageLights(keepOld?: boolean, force?: boolean) {
        if (force) {
            LightsAPI.#package(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => LightsAPI.#package(keepOld), 50)
    }

    static #package(keepOld) {
        const lights = LightsAPI.lights.array
        let primaryBuffer = LightsAPI.primaryBuffer,
            secondaryBuffer = LightsAPI.secondaryBuffer,
            typeBuffer = LightsAPI.typeBuffer
        let size = [0, 0, 0], offset = 0, sizeIndex = 0


        if (!keepOld) {
            for (let i = 0; i < primaryBuffer.length; i++) {
                primaryBuffer[i] = 0
                secondaryBuffer[i] = 0
            }
            for (let i = 0; i < typeBuffer.length; i++)
                typeBuffer[i] = 0
        }

        const toLoopSize = lights.length
        for (let i = 0; i < toLoopSize; i++) {
            const current = lights[i]
            if (offset + 16 > UberShader.MAX_LIGHTS * 16)
                break
            if (!current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            LightsAPI.updateBuffer(current, primaryBuffer, secondaryBuffer, typeBuffer, offset)

            offset += 16
            size[sizeIndex] += 1
        }
        LightsAPI.lightsQuantity = size[0]
        if (LightsAPI.lightsQuantity > 0 || !keepOld) {
            StaticUBOs.uberUBO.bind()
            StaticUBOs.uberUBO.updateData("lightPrimaryBuffer", LightsAPI.primaryBuffer)
            StaticUBOs.uberUBO.updateData("lightSecondaryBuffer", LightsAPI.secondaryBuffer)
            StaticUBOs.uberUBO.updateData("lightTypeBuffer", LightsAPI.typeBuffer)
            StaticUBOs.uberUBO.updateData("lightQuantity", new Uint8Array([Math.min(LightsAPI.lightsQuantity, UberShader.MAX_LIGHTS)]))
            StaticUBOs.uberUBO.unbind()
        }
    }

    static updateBuffer(entity: Entity, primaryBuffer: Float32Array, secondaryBuffer: Float32Array, typeBuffer: Uint8Array, offset: number) {
        const component = entity.lightComponent
        const color = component.fixedColor
        const position = entity.absoluteTranslation
        const attenuation = component.attenuation
        typeBuffer[offset] = component.type

        switch (component.type) {
            case LIGHT_TYPES.DIRECTIONAL: {
                vec3.add(cacheVec3, position, <vec3>component.center)
                const color = component.fixedColor

                primaryBuffer[offset] = cacheVec3[0]
                primaryBuffer[offset + 1] = cacheVec3[1]
                primaryBuffer[offset + 2] = cacheVec3[2]

                primaryBuffer[offset + 4] = color[0]
                primaryBuffer[offset + 5] = color[1]
                primaryBuffer[offset + 6] = color[2]

                primaryBuffer[offset + 8] = component.atlasFace[0]
                primaryBuffer[offset + 9] = component.atlasFace[1]
                primaryBuffer[offset + 10] = (component.shadowMap ? 1 : -1) * component.shadowSamples
                primaryBuffer[offset + 12] = component.shadowBias
                primaryBuffer[offset + 13] = component.shadowAttenuationMinDistance
                primaryBuffer[offset + 14] = component.hasSSS ? 1 : 0

                if (component.shadowMap) {
                    mat4.lookAt(component.__lightView, component.entity.absoluteTranslation, <vec3>component.center, [0, 1, 0])
                    mat4.ortho(component.__lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)

                    mat4.multiply(lightViewProjection, component.__lightProjection, component.__lightView)
                    for (let i = 0; i < 16; i++)
                        secondaryBuffer[offset + i] = lightViewProjection[i]

                    DirectionalShadows.lightsToUpdate.push(component)
                }
                break
            }
            case LIGHT_TYPES.POINT: {
                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[3 + offset] = component.shadowBias

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[7 + offset] = component.shadowSamples

                primaryBuffer[8 + offset] = attenuation[0]
                primaryBuffer[9 + offset] = attenuation[1]

                primaryBuffer[10 + offset] = component.cutoff

                primaryBuffer[11 + offset] = component.zNear
                primaryBuffer[12 + offset] = component.zFar
                primaryBuffer[13 + offset] = (component.shadowMap ? -1 : 1) * (component.hasSSS ? 2 : 1)
                primaryBuffer[14 + offset] = component.shadowAttenuationMinDistance
                primaryBuffer[15 + offset] = component.cutoff * component.smoothing
                if (component.shadowMap)
                    OmnidirectionalShadows.lightsToUpdate.push(component)
                break
            }
            case LIGHT_TYPES.SPOT: {

                vec3.transformQuat(cacheVec3, position, entity._rotationQuat)
                const radius = Math.cos(component.radius * toRad)

                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[8 + offset] = cacheVec3[0]
                primaryBuffer[9 + offset] = cacheVec3[1]
                primaryBuffer[10 + offset] = cacheVec3[2]

                primaryBuffer[11 + offset] = component.cutoff

                primaryBuffer[12 + offset] = attenuation[0]
                primaryBuffer[13 + offset] = attenuation[1]

                primaryBuffer[14 + offset] = radius
                primaryBuffer[15 + offset] = component.hasSSS ? 1 : 0

                break
            }
            case LIGHT_TYPES.SPHERE: {

                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[8 + offset] = component.areaRadius
                primaryBuffer[9 + offset] = 0
                primaryBuffer[10 + offset] = 0

                primaryBuffer[11 + offset] = component.cutoff

                primaryBuffer[12 + offset] = attenuation[0]
                primaryBuffer[13 + offset] = attenuation[1]

                primaryBuffer[14 + offset] = 0
                primaryBuffer[15 + offset] = component.hasSSS ? 1 : 0

                break
            }
            case LIGHT_TYPES.DISK: {
                primaryBuffer[offset] = position[0]
                primaryBuffer[1 + offset] = position[1]
                primaryBuffer[2 + offset] = position[2]

                primaryBuffer[4 + offset] = color[0]
                primaryBuffer[5 + offset] = color[1]
                primaryBuffer[6 + offset] = color[2]

                primaryBuffer[8 + offset] = component.areaRadius
                primaryBuffer[9 + offset] = attenuation[0]
                primaryBuffer[10 + offset] = attenuation[1]

                /**
                 * Light normal
                 */
                vec3.transformMat4(transformedNormalCache, [0, 1, 0], entity.matrix)
                primaryBuffer[11 + offset] = transformedNormalCache[0]
                primaryBuffer[12 + offset] = transformedNormalCache[1]
                primaryBuffer[13 + offset] = transformedNormalCache[2]

                primaryBuffer[14 + offset] = component.cutoff
                primaryBuffer[15 + offset] = component.hasSSS ? 1 : 0

                break
            }
        }

    }


}
