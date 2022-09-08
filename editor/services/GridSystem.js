import * as shaderCode from "../templates/GRID.glsl"
import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/CameraAPI";
import GPU from "../../production/GPU";
import STATIC_SHADERS from "../../static/STATIC_SHADERS";

export default class GridSystem {
    static shader

    static initialize() {
        GridSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GRID, shaderCode.vertex, shaderCode.fragment)
    }

    static execute() {
        if (Engine.params.gridVisibility && !CameraAPI.isOrthographic) {
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