import {linearAlgebraMath} from 'pj-math'
import {vec3} from "gl-matrix";
import {lookAt} from "../../utils/utils";

export default class Camera {
    position = [0, 0, 0]
    yaw = 0
    pitch = 0
    viewMatrix = linearAlgebraMath.generateMatrix(4, 4, 0)

    constructor(canvasID, origin = [0, 0, 0], fov, zNear, zFar, aspectRatio = 1, type) {
        this.canvasID = canvasID
        this.type = type

        this.fov = fov
        this.aspectRatio = aspectRatio
        this.position = origin

        this.updateZPlacement(zNear, zFar)
        this.updateViewMatrix()
    }

    updateZPlacement(zNear, zFar) {
        this.zNear = zNear
        this.zFar = zFar
        this.zScale = this.zFar / (this.zFar - this.zNear)
        this.zOffset = ((-this.zFar * this.zNear) / (this.zFar - this.zNear))

        this.updateProjectionMatrix()
    }

    updateProjectionMatrix() {
        this.projectionMatrix = new Float32Array(linearAlgebraMath.projectionMatrix(this.fov, this.aspectRatio, this.zScale, this.zOffset).flat())
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

