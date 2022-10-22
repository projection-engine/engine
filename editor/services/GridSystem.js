import * as shaderCode from "../shaders/GRID.glsl"
import Engine from "../../Engine";
import CameraAPI from "../../lib/apis/CameraAPI";
import GPU from "../../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";
import {vec3, vec4} from "gl-matrix";

const uniforms = {}
export default class GridSystem {
    static shader
    static buffer = vec4.create()
    static metadataBuffer = vec3.create()

    static initialize() {
        GridSystem.shader = GPU.allocateShader(STATIC_SHADERS.DEVELOPMENT.GRID, shaderCode.vertex, shaderCode.fragment)
        Object.assign(uniforms, {
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            settings: GridSystem.buffer,
            visualSettings: GridSystem.metadataBuffer
        })
    }

    static execute() {
        if (!Engine.params.gridVisibility)
            return
        GridSystem.shader.bindForUse(uniforms)
        GPU.quad.draw()
    }
}