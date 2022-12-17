// @ts-ignore
import PB_LIGHT_COMPUTATION from "../shaders/uber-shader/PB_LIGHT_COMPUTATION.glsl";
// @ts-ignore
import CAMERA_UBO from "../shaders/functions/CAMERA_METADATA_UNIFORM.glsl";
// @ts-ignore
import COMPUTE_AREA_LIGHT from "../shaders/lights/COMPUTE_AREALIGHT.glsl"
// @ts-ignore
import RAY_MARCHER from "../shaders/functions/RAY_MARCHER.glsl";
// @ts-ignore
import ACES from "../shaders/functions/ACES.glsl";
// @ts-ignore
import DEPTH_UTILS from "../shaders/functions/DEPTH_RECONSTRUCTION_UTILS.glsl"
// @ts-ignore
import COMPUTE_LIGHTS from "../shaders/lights/COMPUTE_DIRECTIONAL_LIGHTS.glsl"
// @ts-ignore
import COMPUTE_POINT_LIGHTS from "../shaders/lights/COMPUTE_POINT_LIGHTS.glsl"
// @ts-ignore
import COMPUTE_SPOTLIGHTS from "../shaders/lights/COMPUTE_SPOTLIGHT.glsl"
// @ts-ignore
import BRDF_FUNCTIONS from "../shaders/lights/BRDF_FUNCTIONS.glsl"
// @ts-ignore
import UBER_ATTRIBUTES from "../shaders/uber-shader/ATTRIBUTES.glsl"
// @ts-ignore
import SSS from "../shaders/lights/SSS.glsl"

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
    computeSpotLights: "//import(computeSpotLights)",
    computeAreaLights: "//import(computeAreaLights)"
}


export default function applyShaderMethods(shaderCode) {
    let response = shaderCode

    for (let i = 0; i < 3; i++) {
        Object.keys(METHODS).forEach(key => {
            switch (true) {
                case key === "computeAreaLights":
                    response = response.replaceAll(METHODS[key], COMPUTE_AREA_LIGHT)
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
