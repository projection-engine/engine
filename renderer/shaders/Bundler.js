import {PBR} from './methods/PBR'
import {SHADOWS} from "./methods/Shadows";

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
    calculateShadows: '@import(calculateShadows)'

}


export default class Bundler {
    static applyMethods( shaderCode) {
        let response = shaderCode

        Object.keys(METHODS).forEach(key => {
            if(!PBR[key])
                response = response.replaceAll(METHODS[key], SHADOWS[key])
            else
                response = response.replaceAll(METHODS[key], PBR[key])

        })

        return response
    }
}