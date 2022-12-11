import UBO from "../../instances/UBO";
import ArrayBufferAPI from "../utils/ArrayBufferAPI";
import packageDirectionalLights from "../package-directional-lights";
import packagePointLights from "../package-point-lights";
import {packageLights} from "../package-lights";
import DynamicMap from "../../DynamicMap";
import LightComponent from "../../templates/components/LightComponent";

/**
 * "directionalLightsData" description (mat3 array):
 *
 * Indexes 0 - 2: Light position
 * Indexes 3 - 5: Light color
 * Indexes 6 - 7: Atlas faces
 * Index 8: hasShadowMap / PCF samples (if positive it has shadow map)
 */


const MAX_LIGHTS = 24
let lightTimeout
export default class LightsAPI {
    static lights = new DynamicMap()

    static #initialized = false

    static primaryBufferA = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)
    static primaryBufferB = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)
    static primaryBufferC = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)

    static secondaryBufferA = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)
    static secondaryBufferB = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)
    static secondaryBufferC = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 16, 0, false, false)

    static typeBufferA = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 4, 0, false, false)
    static typeBufferB = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 4, 0, false, false)
    static typeBufferC = ArrayBufferAPI.allocateVector(MAX_LIGHTS * 4, 0, false, false)

    static lightsQuantityA = 0
    static lightsQuantityB = 0
    static lightsQuantityC = 0

    static lightsUBOA
    static lightsUBOB
    static lightsUBOC
    static lightsMetadataUBO

    static initialize() {
        if (LightsAPI.#initialized)
            return
        LightsAPI.#initialized = true
        LightsAPI.lightsMetadataUBO = new UBO(
            "LightsMetadata",
            [
                {name: "shadowMapsQuantity", type: "float"},
                {name: "shadowMapResolution", type: "float"},
            ]
        )
        LightsAPI.lightsUBOA = new UBO(
            "LightDataA",
            [
                {name: "lightPrimaryBufferA", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferA", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferA", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightQuantityA", type: "int"}
            ]
        )
        LightsAPI.lightsUBOB = new UBO(
            "LightDataB",
            [
                {name: "lightPrimaryBufferB", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferB", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferB", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightQuantityB", type: "int"}
            ]
        )
        LightsAPI.lightsUBOC = new UBO(
            "LightDataC",
            [
                {name: "lightPrimaryBufferC", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightSecondaryBufferC", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightTypeBufferC", type: "mat4", dataLength: MAX_LIGHTS},
                {name: "lightQuantityC", type: "int"}
            ]
        )
    }
    static updateABuffer() {
        LightsAPI.lightsUBOA.bind()
        LightsAPI.lightsUBOA.updateData("lightQuantityA", new Uint8Array([Math.min(LightsAPI.lightsQuantityA, MAX_LIGHTS)]))
        LightsAPI.lightsUBOA.updateData("lightPrimaryBufferA", LightsAPI.primaryBufferA)
        LightsAPI.lightsUBOA.updateData("lightSecondaryBufferA", LightsAPI.secondaryBufferA)
        LightsAPI.lightsUBOA.updateData("lightTypeBufferA", LightsAPI.typeBufferA)
        LightsAPI.lightsUBOA.unbind()
    }

    static updateBBuffer() {
        LightsAPI.lightsUBOB.bind()
        LightsAPI.lightsUBOB.updateData("lightQuantityB", new Uint8Array([Math.min(LightsAPI.lightsQuantityB, MAX_LIGHTS)]))
        LightsAPI.lightsUBOB.updateData("lightPrimaryBufferB", LightsAPI.primaryBufferB)
        LightsAPI.lightsUBOB.updateData("lightSecondaryBufferB", LightsAPI.secondaryBufferB)
        LightsAPI.lightsUBOB.updateData("lightTypeBufferB", LightsAPI.typeBufferB)
        LightsAPI.lightsUBOB.unbind()
    }

    static updateCBuffer() {
        LightsAPI.lightsUBOC.bind()
        LightsAPI.lightsUBOC.updateData("lightQuantityC", new Uint8Array([Math.min(LightsAPI.lightsQuantityC, MAX_LIGHTS)]))
        LightsAPI.lightsUBOC.updateData("lightPrimaryBufferC", LightsAPI.primaryBufferC)
        LightsAPI.lightsUBOC.updateData("lightSecondaryBufferC", LightsAPI.secondaryBufferC)
        LightsAPI.lightsUBOC.updateData("lightTypeBufferC", LightsAPI.typeBufferC)
        LightsAPI.lightsUBOC.unbind()
    }


    static packageLights(keepOld, force) {
        if (force) {
            LightsAPI.#package(keepOld)
            return
        }
        clearTimeout(lightTimeout)
        lightTimeout = setTimeout(() => LightsAPI.#package(keepOld), 50)
    }

    static #package(keepOld) {
        const lights = LightsAPI.lights.array
        const primaryBuffer = LightsAPI.primaryBufferA,
            secondaryBuffer = LightsAPI.secondaryBufferA,
            typeBuffer = LightsAPI.typeBufferA

        let size = 0, offset = 0

        if (!keepOld) {
            for (let i = 0; i < primaryBuffer.length; i++) {
                primaryBuffer[i] = 0
                secondaryBuffer[i] = 0
            }
            for (let i = 0; i < typeBuffer.length; i++)
                typeBuffer[i] = 0
        }

        for (let i = 0; i < lights.length; i++) {
            const current = lights[i]

            if (offset + 16 > primaryBuffer.length || !current.active || !current.changesApplied && !current.needsLightUpdate && keepOld)
                continue
            LightComponent.updateBuffer(current, primaryBuffer, secondaryBuffer, typeBuffer, offset)
            offset += 16
            size++
        }

        LightsAPI.lightsQuantityA = size
        LightsAPI.updateABuffer()
    }



}
