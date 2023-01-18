import PB_LIGHT_COMPUTATION from "../shaders/uber-shader/PB_LIGHT_COMPUTATION.glsl";
import CAMERA_UBO from "../shaders/functions/CAMERA_METADATA_UNIFORM.glsl";
import POST_PROCESSING_UNIFORMS from "../shaders/functions/POST_PROCESSING_UNIFORMS.glsl";
import COMPUTE_AREA_LIGHT from "../shaders/uber-shader/lights/COMPUTE_AREALIGHT.glsl"
import RAY_MARCHER from "../shaders/functions/RAY_MARCHER.glsl";
import ACES from "../shaders/functions/ACES.glsl";
import DEPTH_UTILS from "../shaders/functions/DEPTH_RECONSTRUCTION_UTILS.glsl"
import COMPUTE_LIGHTS from "../shaders/uber-shader/lights/COMPUTE_DIRECTIONAL_LIGHTS.glsl"
import COMPUTE_POINT_LIGHTS from "../shaders/uber-shader/lights/COMPUTE_POINT_LIGHTS.glsl"
import COMPUTE_SPOTLIGHTS from "../shaders/uber-shader/lights/COMPUTE_SPOTLIGHT.glsl"
import BRDF_FUNCTIONS from "../shaders/uber-shader/lights/BRDF_FUNCTIONS.glsl"
import STRONG_BLUR from "../shaders/functions/STRONG_BLUR.glsl"
import UBER_ATTRIBUTES from "../shaders/uber-shader/ATTRIBUTES.glsl"
import SSS from "../shaders/uber-shader/lights/SSS.glsl"

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
    computeAreaLights: "//import(computeAreaLights)",
    ppUBO: "//import(ppUBO)",
    blur: "//import(blur)"
}


export default function applyShaderMethods(shaderCode) {
    let response = shaderCode

    for (let i = 0; i < 3; i++) {
        Object.keys(METHODS).forEach(key => {
            switch (true) {
                case key === "computeAreaLights":
                    response = response.replaceAll(METHODS[key], COMPUTE_AREA_LIGHT)
                    break
                case key === "blur":
                    response = response.replaceAll(METHODS[key], STRONG_BLUR)
                    break
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
                case key === "ppUBO":
                    response = response.replaceAll(METHODS[key], POST_PROCESSING_UNIFORMS)
                    break
                case key === "rayMarcher":
                    response = response.replaceAll(METHODS[key], RAY_MARCHER)
                    break
                case key === "aces":
                    response = response.replaceAll(METHODS[key], ACES)
                    break
            }
        })
    }

    return response
}
