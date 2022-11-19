import POPULATE_G_BUFFER from "../shaders/utils/POPULATE_GBUFFER.glsl";
import CAMERA_UBO from "../shaders/utils/CAMERA_METADATA_UNIFORM.glsl";
import SAMPLE_INDIRECT_LIGHT from "../shaders/utils/SAMPLE_INDIRECT_LIGHT.glsl";
import COMPUTE_TBN from "../shaders/utils/COMPUTE_TBN.glsl";
import PARALLAX_OCCLUSION_MAPPING from "../shaders/utils/PARALLAX_OCCLUSION_MAPPING.glsl";
import RAY_MARCHER from "../shaders/utils/RAY_MARCHER.glsl";
import ACES from "../shaders/utils/ACES.glsl";
import {PBR} from "../shaders/templates/PBR";

const METHODS = {
    populateGBuffer: "//import(populateGBuffer)",

    computeShadows: "//import(computeShadows)",
    cameraUBO: "//import(cameraUBO)",
    distributionGGX: "//import(distributionGGX)",
    geometrySchlickGGX: "//import(geometrySchlickGGX)",
    geometrySmith: "//import(geometrySmith)",
    fresnelSchlick: "//import(fresnelSchlick)",
    computeLights: "//import(computeLights)",

    computeTBN: "//import(computeTBN)",
    rayMarcher: "//import(rayMarcher)",
    aces: "//import(aces)",
    parallaxOcclusionMapping: "//import(parallaxOcclusionMapping)",
    sampleIndirectLight: "//import(sampleIndirectLight)"
}


export default function applyShaderMethods(shaderCode) {
    let response = shaderCode

    Object.keys(METHODS).forEach(key => {
        switch (true) {
            case key === "populateGBuffer":
                response = response.replaceAll(METHODS[key], POPULATE_G_BUFFER)
                break
            case key === "cameraUBO":
                response = response.replaceAll(METHODS[key], CAMERA_UBO)
                break
            case key === "sampleIndirectLight":
                response = response.replaceAll(METHODS[key], SAMPLE_INDIRECT_LIGHT)
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
            case PBR[key] != null:
                response = response.replaceAll(METHODS[key], PBR[key])
                break
            default:
                break
        }
    })
    return response
}
