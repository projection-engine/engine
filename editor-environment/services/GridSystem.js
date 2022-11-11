import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import {vec3, vec4} from "gl-matrix";

const uniforms = {}
export default class GridSystem {
    static shader
    static buffer = vec4.create()
    static metadataBuffer = vec3.create()

    static initialize() {

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
        drawQuad()
    }
}