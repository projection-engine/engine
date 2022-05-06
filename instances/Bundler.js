import {PBR} from '../shaders/methods/PBR'
import Shadows from "../shaders/methods/Shadows";
import GI from "../shaders/methods/GI";

export const METHODS = {
    distributionGGX: '@import(distributionGGX)',
    geometrySchlickGGX: '@import(geometrySchlickGGX)',
    geometrySmith: '@import(geometrySmith)',
    fresnelSchlick: '@import(fresnelSchlick)',
    fresnelSchlickRoughness: '@import(fresnelSchlickRoughness)',
    computeDirectionalLight: '@import(computeDirectionalLight)',
    computePointLight: '@import(computePointLight)',


    calculateShadows: '@import(calculateShadows)',
    gi: '@import(GI)',
}


export default class Bundler {
    static applyMethods( shaderCode) {
        let response = shaderCode

        Object.keys(METHODS).forEach(key => {
            if(key === 'gi')
                response = response.replaceAll(METHODS[key], GI)
            if(key === 'calculateShadows')
                response = response.replaceAll(METHODS[key], Shadows)
            if(PBR[key])
                response = response.replaceAll(METHODS[key], PBR[key])
        })

        return response
    }
}