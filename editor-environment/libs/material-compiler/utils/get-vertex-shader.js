import MATERIAL_RENDERING_TYPES from "../../../../static/MATERIAL_RENDERING_TYPES";
import {vertexSkybox} from "../templates/skybox-shader";
import TEMPLATE_VERTEX_SHADER from "../../../../static/TEMPLATE_VERTEX_SHADER";

export default function getVertexShader(type) {
    if(type === MATERIAL_RENDERING_TYPES.SKYBOX)
        return vertexSkybox
    return TEMPLATE_VERTEX_SHADER
}
