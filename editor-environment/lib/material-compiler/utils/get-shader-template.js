import MATERIAL_RENDERING_TYPES from "../../../../static/MATERIAL_RENDERING_TYPES";
import forwardTemplate from "../templates/forward-shader";
import deferredTemplate from "../templates/deferred-shader";
import skyboxShader from "../templates/skybox-shader";
import unlitTemplate from "../templates/unlit-shader";

export default function getShaderTemplate(type) {
    switch (type) {
        case MATERIAL_RENDERING_TYPES.FORWARD:
            return forwardTemplate
        case MATERIAL_RENDERING_TYPES.DEFERRED:
            return deferredTemplate
        case MATERIAL_RENDERING_TYPES.SKYBOX:
            return skyboxShader
        default:
            return unlitTemplate
    }
}