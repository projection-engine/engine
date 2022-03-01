import {PBR} from '../../shaders/resources/mesh/PBR'
import {SHADOWS} from "../../shaders/resources/shadows/Shadows";
import {LVP} from "../../shaders/resources/gi/LVP";

export const METHODS = {
    distributionGGX: '@import(distributionGGX)',
    geometrySchlickGGX: '@import(geometrySchlickGGX)',
    geometrySmith: '@import(geometrySmith)',
    fresnelSchlick: '@import(fresnelSchlick)',
    fresnelSchlickRoughness: '@import(fresnelSchlickRoughness)',
    computeDirectionalLight: '@import(computeDirectionalLight)',


    sampleShadowMap: '@import(sampleShadowMap)',
    sampleShadowMapLinear: '@import(sampleShadowMapLinear)',
    sampleSoftShadows: '@import(sampleSoftShadows)',
    calculateShadows: '@import(calculateShadows)',

    lvpCommon:'@import(lvpCommon)'
}


export default class Bundler {
    static applyMethods( shaderCode) {
        let response = shaderCode

        Object.keys(METHODS).forEach(key => {
            if(SHADOWS[key])
                response = response.replaceAll(METHODS[key], SHADOWS[key])
            if(PBR[key])
                response = response.replaceAll(METHODS[key], PBR[key])
            if(LVP[key])
                response = response.replaceAll(METHODS[key], LVP[key])
        })

        return response
    }
}