import {mat4, vec3} from "gl-matrix";
import Camera from "./utils/camera/Camera";
import {lookAt} from "./utils/misc/utils";

export default class RootCamera {
    position = [0, 10, 0]
    yaw = 0
    pitch = 0
    roll = 0

    zNear = .1
    zFar = 1000
    fov = Math.PI / 2
    aspectRatio = 1
    viewMatrix = mat4.create()
    projectionMatrix = mat4.create()
    centerOn = [0, 0, 0]

    constructor() {
        this.updateProjection()
        this.updateViewMatrix()
    }

    updateProjection() {
        mat4.perspective(this.projectionMatrix, this.fov, this.aspectRatio, this.zNear, this.zFar)
    }

    getNotTranslatedViewMatrix() {
        let m = [...this.viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
    }

    updateViewMatrix() {
        this.viewMatrix = lookAt(this.yaw, this.pitch, this.position)
    }
}

