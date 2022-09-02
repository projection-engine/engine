import * as shaderCode from "../templates/GRID.glsl"
import RendererController from "../../production/controllers/RendererController";
import CameraAPI from "../../production/libs/CameraAPI";
import GPU from "../../production/controllers/GPU";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";

export default class GridSystem {
    static shader

    static initialize() {
        GridSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GRID, shaderCode.vertex, shaderCode.fragment)
    }

    static execute() {
        if (RendererController.params.gridVisibility && !CameraAPI.isOrthographic) {
            GridSystem.shader.bindForUse({
                viewMatrix: CameraAPI.viewMatrix,
                projectionMatrix: CameraAPI.projectionMatrix,
                gamma: CameraAPI.metadata.gamma,
                exposure: CameraAPI.metadata.exposure
            })
            GPU.quad.draw()
        }
    }
}