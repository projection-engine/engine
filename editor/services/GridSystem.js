import * as shaderCode from "../templates/GRID.glsl"
import Engine from "../../production/Engine";
import CameraAPI from "../../production/apis/CameraAPI";
import GPU from "../../production/GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import {vec4} from "gl-matrix";

const uniforms = {}
export default class GridSystem {
    static shader

    static buffer = vec4.create()

    static initialize() {
        GridSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GRID, shaderCode.vertex, shaderCode.fragment)
        Object.assign(uniforms, {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            settings: GridSystem.buffer
        })
    }

    static execute() {
        if (!Engine.params.gridVisibility)
            return
        GridSystem.shader.bindForUse(uniforms)
        GPU.quad.draw()
    }
}