import {linearAlgebraMath} from 'pj-math'
import {vec3} from "gl-matrix";

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

function lookAt(yaw, pitch, position) {
    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    let xAxis = [cosYaw, 0, -sinYaw],
        yAxis = [sinYaw * sinPitch, cosPitch, cosYaw * sinPitch],
        zAxis = [sinYaw * cosPitch, -sinPitch, cosPitch * cosYaw]
    let p1, p2, p3

    p1 = vec3.dot(position, xAxis)
    p2 = vec3.dot(position, yAxis)
    p3 = vec3.dot(position, zAxis)

    return [
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -p1, -p2, -p3, 1
    ]
}