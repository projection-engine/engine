import PB_LIGHT_COMPUTATION from "../shaders/utils/PB_LIGHT_COMPUTATION.glsl";
import CAMERA_UBO from "../shaders/utils/CAMERA_METADATA_UNIFORM.glsl";
import COMPUTE_TBN from "../shaders/utils/COMPUTE_TBN.glsl";
import PARALLAX_OCCLUSION_MAPPING from "../shaders/utils/PARALLAX_OCCLUSION_MAPPING.glsl";
import RAY_MARCHER from "../shaders/utils/RAY_MARCHER.glsl";
import ACES from "../shaders/utils/ACES.glsl";
import DEPTH_UTILS from "../shaders/utils/DEPTH_RECONSTRUCTION_UTILS.glsl"
import COMPUTE_LIGHTS from "../shaders/utils/COMPUTE_LIGHTS.glsl"

const METHODS = {
    cameraUBO: "//import(cameraUBO)",
    computeLights: "//import(computeLights)",
    computeTBN: "//import(computeTBN)",
    rayMarcher: "//import(rayMarcher)",
    aces: "//import(aces)",
    parallaxOcclusionMapping: "//import(parallaxOcclusionMapping)",
    depthReconstructionUtils: "//import(depthReconstructionUtils)",
    pbLightComputation: "//import(pbLightComputation)"
}


export default function applyShaderMethods(shaderCode) {
    let response = shaderCode

    for (let i = 0; i < 3; i++) {
        Object.keys(METHODS).forEach(key => {
            switch (true) {
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

                case key === "computeTBN":
                    response = response.replaceAll(METHODS[key], COMPUTE_TBN)
                    break
                case key === "parallaxOcclusionMapping":
                    response = response.replaceAll(METHODS[key], PARALLAX_OCCLUSION_MAPPING)
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
