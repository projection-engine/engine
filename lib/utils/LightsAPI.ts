import ArrayBufferAPI from "./ArrayBufferAPI";
import LIGHT_TYPES from "../../static/LIGHT_TYPES";
import {mat4, quat, vec3} from "gl-matrix";
import DirectionalShadows from "../../runtime/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/OmnidirectionalShadows";
import type Entity from "../../instances/Entity";
import UberShader from "../../utils/UberShader";
import StaticUBOs from "../StaticUBOs";
import ResourceEntityMapper from "../../resource-libs/ResourceEntityMapper";


let lightTimeout
const toRad = Math.PI / 180
const transformedNormalCache = vec3.create(),
    lightViewProjection = mat4.create()
const quantity = new Uint8Array(1)
/**
 * @property primaryBuffer: indexes 0-3 are reserved for [type - color - color - color]
 */
const cache1Mat4 = mat4.create()
const cache2Mat4 = mat4.create()
export default class LightsAPI {


    static primaryBuffer = <Float32Array>ArrayBufferAPI.allocateVector(UberShader.MAX_LIGHTS * 16, 0, false, false, false)
    static secondaryBuffer = <Float32Array>ArrayBufferAPI.allocateVector(UberShader.MAX_LIGHTS * 16, 0, false, false, false)
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
        const lights = ResourceEntityMapper.lights.array
        const primaryBuffer = LightsAPI.primaryBuffer,
            secondaryBuffer = LightsAPI.secondaryBuffer
        let size = 0, offset = 0


        if (!keepOld)
            for (let i = 0; i < primaryBuffer.length; i++) {
                primaryBuffer[i] = 0
                secondaryBuffer[i] = 0
            }

        const toLoopSize = lights.length
        for (let i = 0; i < toLoopSize; i++) {
            const current = lights[i]
            if (offset + 16 > UberShader.MAX_LIGHTS * 16)
                break
            if (!current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            LightsAPI.updateBuffer(current, primaryBuffer, secondaryBuffer, offset)

            offset += 16
            size++
        }
        LightsAPI.lightsQuantity = size
        if (LightsAPI.lightsQuantity > 0 || !keepOld) {
            StaticUBOs.lightsUBO.bind()
            StaticUBOs.lightsUBO.updateData("lightPrimaryBuffer", LightsAPI.primaryBuffer)
            StaticUBOs.lightsUBO.updateData("lightSecondaryBuffer", LightsAPI.secondaryBuffer)
            StaticUBOs.lightsUBO.unbind()

            StaticUBOs.uberUBO.bind()
            quantity[0] = Math.min(LightsAPI.lightsQuantity, UberShader.MAX_LIGHTS)
            StaticUBOs.uberUBO.updateData("lightQuantity", quantity)
            StaticUBOs.uberUBO.unbind()
        }
    }

    static updateBuffer(entity: Entity, primaryBuffer: Float32Array, secondaryBuffer: Float32Array, offset: number) {
        const component = entity.lightComponent
        const color = component.fixedColor
        const position = entity.absoluteTranslation
        const attenuation = component.attenuation

        primaryBuffer[offset] = component.type
        primaryBuffer[offset + 1] = color[0]
        primaryBuffer[offset + 2] = color[1]
        primaryBuffer[offset + 3] = color[2]

        primaryBuffer[offset + 4] = position[0]
        primaryBuffer[offset + 5] = position[1]
        primaryBuffer[offset + 6] = position[2]

        switch (component.type) {
            case LIGHT_TYPES.DIRECTIONAL: {

                primaryBuffer[offset + 8] = component.atlasFace[0]
                primaryBuffer[offset + 9] = component.atlasFace[1]
                primaryBuffer[offset + 10] = (component.shadowMap ? 1 : -1) * component.shadowSamples
                primaryBuffer[offset + 12] = component.shadowBias
                primaryBuffer[offset + 13] = component.shadowAttenuationMinDistance
                primaryBuffer[offset + 14] = component.hasSSS ? 1 : 0

                if (component.shadowMap) {
                    mat4.lookAt(component.__lightView, component.entity.absoluteTranslation, [0, 0, 0], [0, 1, 0])
                    mat4.ortho(component.__lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)
                    mat4.multiply(lightViewProjection, component.__lightProjection, component.__lightView)

                    for (let i = 0; i < 16; i++)
                        secondaryBuffer[offset + i] = lightViewProjection[i]

                    DirectionalShadows.lightsToUpdate.push(component)
                }
                break
            }
            case LIGHT_TYPES.POINT: {
                primaryBuffer[7 + offset] = component.shadowSamples
                primaryBuffer[8 + offset] = attenuation[0]
                primaryBuffer[9 + offset] = attenuation[1]
                primaryBuffer[10 + offset] = component.cutoff
                primaryBuffer[11 + offset] = component.zNear
                primaryBuffer[12 + offset] = component.zFar
                primaryBuffer[13 + offset] = (component.shadowMap ? -1 : 1) * (component.hasSSS ? 2 : 1)
                primaryBuffer[14 + offset] = component.shadowAttenuationMinDistance
                primaryBuffer[15 + offset] = component.cutoff * component.smoothing

                secondaryBuffer[0] = component.shadowBias
                if (component.shadowMap)
                    OmnidirectionalShadows.lightsToUpdate.push(component)
                break
            }
            case LIGHT_TYPES.SPOT: {
                mat4.lookAt(cache1Mat4, position, position, [0, 1, 0]);
                mat4.fromQuat(cache2Mat4, entity._rotationQuat)
                mat4.multiply(cache1Mat4, cache1Mat4, cache2Mat4)


                primaryBuffer[8 + offset] = cache1Mat4[8]
                primaryBuffer[9 + offset] = cache1Mat4[9]
                primaryBuffer[10 + offset] = cache1Mat4[10]

                primaryBuffer[11 + offset] = component.cutoff

                primaryBuffer[12 + offset] = attenuation[0]
                primaryBuffer[13 + offset] = attenuation[1]

                primaryBuffer[14 + offset] = Math.cos(component.radius * toRad)
                primaryBuffer[15 + offset] = component.hasSSS ? 1 : 0

                break
            }
            case LIGHT_TYPES.SPHERE: {
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
