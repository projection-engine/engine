import UBO from "../../instances/UBO";
import ArrayBufferAPI from "./ArrayBufferAPI";
import DynamicMap from "../../templates/DynamicMap";
import LIGHT_TYPES from "../../static/LIGHT_TYPES";
import {mat4, vec3} from "gl-matrix";
import DirectionalShadows from "../../runtime/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/OmnidirectionalShadows";
import Entity from "../../instances/Entity";


const MAX_LIGHTS = 24
let lightTimeout
const toRad = Math.PI / 180
const lightView = mat4.create(),
    lightProjection = mat4.create(),
    transformedNormalCache = vec3.create(),
    lightViewProjection = mat4.create()

const cacheVec3 = vec3.create()

export default class LightsAPI {
    static lights = new DynamicMap()

    static #initialized = false

    static primaryBufferA = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)
    static primaryBufferB = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)
    static primaryBufferC = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)

    static secondaryBufferA = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)
    static secondaryBufferB = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)
    static secondaryBufferC = <Float32Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false, false)

    static typeBufferA = <Uint8Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS, 0, false, false, true)
    static typeBufferB = <Uint8Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS, 0, false, false, true)
    static typeBufferC = <Uint8Array>ArrayBufferAPI.allocateVector(MAX_LIGHTS, 0, false, false, true)

    static lightsQuantityA = 0
    static lightsQuantityB = 0
    static lightsQuantityC = 0

    static lightsUBOA?:UBO
    static lightsUBOB?:UBO
    static lightsUBOC?:UBO
    static lightsMetadataUBO?:UBO

    static initialize() {
        if (LightsAPI.#initialized)
            return
        LightsAPI.#initialized = true
        LightsAPI.lightsMetadataUBO = new UBO(
            "LightsMetadata",
            [
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
                {name: "lightQuantityA", type: "int"},
                {name: "lightQuantityB", type: "int"},
                {name: "lightQuantityC", type: "int"}
            ]
        )
        LightsAPI.lightsUBOA = new UBO(
            "LightDataA",
            [
                {name: "lightPrimaryBufferA", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferA", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferA", type: "int", dataLength: MAX_LIGHTS}
            ]
        )
        LightsAPI.lightsUBOB = new UBO(
            "LightDataB",
            [
                {name: "lightPrimaryBufferB", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferB", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferB", type: "int", dataLength: MAX_LIGHTS}
            ]
        )
        LightsAPI.lightsUBOC = new UBO(
            "LightDataC",
            [
                {name: "lightPrimaryBufferC", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferC", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferC", type: "int", dataLength: MAX_LIGHTS}
            ]
        )
    }

    static updateABuffer() {
        LightsAPI.lightsUBOA.bind()
        LightsAPI.lightsUBOA.updateData("lightPrimaryBufferA", LightsAPI.primaryBufferA)
        LightsAPI.lightsUBOA.updateData("lightSecondaryBufferA", LightsAPI.secondaryBufferA)
        LightsAPI.lightsUBOA.updateData("lightTypeBufferA", LightsAPI.typeBufferA)
        LightsAPI.lightsUBOA.unbind()

        LightsAPI.lightsMetadataUBO.bind()
        LightsAPI.lightsMetadataUBO.updateData("lightQuantityA", new Uint8Array([Math.min(LightsAPI.lightsQuantityA, MAX_LIGHTS)]))
        LightsAPI.lightsMetadataUBO.unbind()
    }

    static updateBBuffer() {
        LightsAPI.lightsUBOB.bind()

        LightsAPI.lightsUBOB.updateData("lightPrimaryBufferB", LightsAPI.primaryBufferB)
        LightsAPI.lightsUBOB.updateData("lightSecondaryBufferB", LightsAPI.secondaryBufferB)
        LightsAPI.lightsUBOB.updateData("lightTypeBufferB", LightsAPI.typeBufferB)
        LightsAPI.lightsUBOB.unbind()

        LightsAPI.lightsMetadataUBO.bind()
        LightsAPI.lightsMetadataUBO.updateData("lightQuantityB", new Uint8Array([Math.min(LightsAPI.lightsQuantityB, MAX_LIGHTS)]))
        LightsAPI.lightsMetadataUBO.unbind()
    }

    static updateCBuffer() {
        LightsAPI.lightsUBOC.bind()

        LightsAPI.lightsUBOC.updateData("lightPrimaryBufferC", LightsAPI.primaryBufferC)
        LightsAPI.lightsUBOC.updateData("lightSecondaryBufferC", LightsAPI.secondaryBufferC)
        LightsAPI.lightsUBOC.updateData("lightTypeBufferC", LightsAPI.typeBufferC)
        LightsAPI.lightsUBOC.unbind()

        LightsAPI.lightsMetadataUBO.bind()
        LightsAPI.lightsMetadataUBO.updateData("lightQuantityC", new Uint8Array([Math.min(LightsAPI.lightsQuantityC, MAX_LIGHTS)]))
        LightsAPI.lightsMetadataUBO.unbind()
    }


    static packageLights(keepOld?:boolean, force?:boolean) {
        if (force) {
            LightsAPI.#package(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => LightsAPI.#package(keepOld), 50)
    }

    static #package(keepOld) {
        const lights = LightsAPI.lights.array
        let primaryBuffer = LightsAPI.primaryBufferA,
            secondaryBuffer = LightsAPI.secondaryBufferA,
            typeBuffer = LightsAPI.typeBufferA
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

            if (offset + 16 > MAX_LIGHTS * 16) {
                offset = 0

                if (LightsAPI.primaryBufferA === primaryBuffer) {
                    primaryBuffer = LightsAPI.primaryBufferB
                    secondaryBuffer = LightsAPI.secondaryBufferB
                    typeBuffer = LightsAPI.typeBufferB
                    sizeIndex = 1
                } else {
                    primaryBuffer = LightsAPI.primaryBufferC
                    secondaryBuffer = LightsAPI.secondaryBufferC
                    typeBuffer = LightsAPI.typeBufferC
                    sizeIndex = 2
                }
            }

            if (offset + 16 > MAX_LIGHTS * 16 && primaryBuffer === LightsAPI.primaryBufferC || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            LightsAPI.updateBuffer(current, primaryBuffer, secondaryBuffer, typeBuffer, offset)
            console.trace(primaryBuffer)
            console.trace(typeBuffer)
            offset += 16
            size[sizeIndex] += 1
        }
        LightsAPI.lightsQuantityA = size[0]
        if (LightsAPI.lightsQuantityA > 0 || !keepOld)
            LightsAPI.updateABuffer()

        LightsAPI.lightsQuantityB = size[1]
        if (LightsAPI.lightsQuantityB > 0 || !keepOld)
            LightsAPI.updateBBuffer()

        LightsAPI.lightsQuantityC = size[2]
        if (LightsAPI.lightsQuantityC > 0 || !keepOld)
            LightsAPI.updateCBuffer()
    }

    static updateBuffer(entity: Entity, primaryBuffer: Float32Array, secondaryBuffer: Float32Array, typeBuffer: Uint8Array, offset: number) {
        const component = entity.__lightComp
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
                    mat4.lookAt(lightView, component.__entity.absoluteTranslation, <vec3>component.center, [0, 1, 0])
                    mat4.ortho(lightProjection, -component.size, component.size, -component.size, component.size, component.zNear, component.zFar)

                    mat4.multiply(lightViewProjection, lightProjection, lightView)
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
