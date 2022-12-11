import PB_LIGHT_COMPUTATION from "../shaders/uber-shader/PB_LIGHT_COMPUTATION.glsl";
import CAMERA_UBO from "../shaders/functions/CAMERA_METADATA_UNIFORM.glsl";


import RAY_MARCHER from "../shaders/functions/RAY_MARCHER.glsl";
import ACES from "../shaders/functions/ACES.glsl";
import DEPTH_UTILS from "../shaders/functions/DEPTH_RECONSTRUCTION_UTILS.glsl"
import COMPUTE_LIGHTS from "../shaders/functions/COMPUTE_DIRECTIONAL_LIGHTS.glsl"
import COMPUTE_POINT_LIGHTS from "../shaders/functions/COMPUTE_POINT_LIGHTS.glsl"
import COMPUTE_SPOTLIGHTS from "../shaders/functions/COMPUTE_SPOTLIGHT.glsl"
import BRDF_FUNCTIONS from "../shaders/functions/BRDF_FUNCTIONS.glsl"

import UBER_ATTRIBUTES from "../shaders/uber-shader/ATTRIBUTES.glsl"
import SSS from "../shaders/functions/SSS.glsl"

const METHODS = {
    cameraUBO: "//import(cameraUBO)",
    computeLights: "//import(computeLights)",
    rayMarcher: "//import(rayMarcher)",
    aces: "//import(aces)",
    uberAttributes: "//import(uberAttributes)",
    depthReconstructionUtils: "//import(depthReconstructionUtils)",
    pbLightComputation: "//import(pbLightComputation)",
    SSS: "//import(SSS)",
    computePointLights: "//import(computePointLights)",
    brdf: "//import(brdf)",
    computeSpotLights: "//import(computeSpotLights)"
}


export default function applyShaderMethods(shaderCode) {
    let response = shaderCode

    for (let i = 0; i < 3; i++) {
        Object.keys(METHODS).forEach(key => {
            switch (true) {
                case key === "computeSpotLights":
                    response = response.replaceAll(METHODS[key], COMPUTE_SPOTLIGHTS)
                    break
                case key === "brdf":
                    response = response.replaceAll(METHODS[key], BRDF_FUNCTIONS)
                    break
                case key === "SSS":
                    response = response.replaceAll(METHODS[key], SSS)
                    break
                case key === "computePointLights":
                    response = response.replaceAll(METHODS[key], COMPUTE_POINT_LIGHTS)
                    break
                case key === "uberAttributes":
                    response = response.replaceAll(METHODS[key], UBER_ATTRIBUTES)
                    break
                case key === "computeLights":
                    response = response.replaceAll(METHODS[key], COMPUTE_LIGHTS)
                    break
                case key === "pbLightComputation":
                    response = response.replaceAll(METHODS[key], PB_LIGHT_COMPUTATION)
                    break
                case key === "depthReconstructionUtils":
                    response = response.replaceAll(METHODS[key], DEPTH_UTILS)
                    break
                case key === "cameraUBO":
                    response = response.replaceAll(METHODS[key], CAMERA_UBO)
                    break
                case key === "rayMarcher":
                    response = response.replaceAll(METHODS[key], RAY_MARCHER)
                    break
                case key === "aces":
                    response = response.replaceAll(METHODS[key], ACES)
                    break
                default:
                    break
            }
        })
    }

    return response
}
