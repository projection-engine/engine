import {mat4} from "gl-matrix";
import Camera from "./Camera";

export default class SphericalCamera extends Camera {
    _radius = 25
    centerLookAt = [0, 0, 0]

    constructor(origin, fov, zNear, zFar, aspectRatio) {
        super(origin, fov, zNear, zFar, aspectRatio,);

        this.centerLookAt = [0, 0, 0]

        this.pitch = .5
        this.yaw = .5

    }

    get projectionMatrix() {
        return this._projectionMatrix
    }

    get position() {
        return this._position
    }

    getNotTranslatedViewMatrix() {
        let m = [...this.viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
    }

    get yaw() {
        return this._yaw
    }

    get pitch() {
        return this._pitch
    }

    set yaw(data) {
        this._yaw = data

        this.updateViewMatrix()
    }

    set pitch(data) {
        this._pitch = data
        this.updateViewMatrix()
    }

    set radius(data) {
        this._radius = data
        this.updateViewMatrix()
    }

    set centerLookAt(data) {
        this.centerLookAt = data
        this.updateViewMatrix()
    }


    get radius() {
        return this._radius
    }

    updateViewMatrix() {
        super.updateViewMatrix()
        this.position[0] = this.radius * Math.cos(this._pitch) * Math.cos(this._yaw)
        this.position[1] = this.radius * Math.sin(this._pitch)
        this.position[2] = this.radius * Math.cos(this._pitch) * Math.sin(this._yaw)

        mat4.lookAt(this.viewMatrix, this.position, this.centerLookAt ? this.centerLookAt : [0, 0, 0], [0, 1, 0])
    }
}

