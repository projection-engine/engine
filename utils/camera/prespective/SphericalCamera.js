import {mat4, vec3} from "gl-matrix";
import Camera from "../Camera";

export default class SphericalCamera extends Camera {
    _radius = 25
    centerOn = [0,0,0]

    constructor(origin, fov, zNear, zFar, aspectRatio) {
        super(origin, fov, zNear, zFar, aspectRatio,);
        this._pitch = .5
        this._yaw = .5
        this.updateViewMatrix()

    }

    // FOV - ASPECT - PROJECTION
    get fov (){
        return this._fov
    }
    set fov(data){
        this._fov = data
        this.updateProjection()
    }
    get aspectRatio() {
        return this._aspectRatio
    }
    set aspectRatio(data) {
        this._aspectRatio = data
        this.updateProjection()
    }
    updateProjection(){
        // mat4.ortho(this._projectionMatrix, -50, 50, -50, 50, this._zNear, this._zFar);
        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }
    set position(data) {
        this._position = data
        this.updateViewMatrix()
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
    }

    set pitch(data) {
        this._pitch = data

    }

    set radius(data) {
        this._radius = data
        this.updateViewMatrix()
    }


    get radius() {
        return this._radius
    }

    updateViewMatrix() {
        super.updateViewMatrix()
        if(this._pitch > 1.5)
            this._pitch = 1.5
        if(this._pitch < -1.5)
            this._pitch = -1.5

        this._position[0] = this.radius * Math.cos(this._pitch) * Math.cos(this._yaw)
        this._position[1] = this.radius * Math.sin(this._pitch)
        this._position[2] = this.radius * Math.cos(this._pitch) * Math.sin(this._yaw)
        vec3.add(this._position, this._position, this.centerOn)
        mat4.lookAt(this.viewMatrix, this._position, this.centerOn, [0, 1, 0])

    }
}

