import {linearAlgebraMath} from "pj-math";
import {mat4, quat} from "gl-matrix";

export default class Camera {
    _position = [0, 0, 0]
    _yaw = 0
    _pitch = 0

    direction = {}
    _fov = Math.PI/2
    _projectionMatrix = mat4.create()

    _viewMatrix = mat4.create()

    constructor(

        origin = [0, 0, 0],
        fov,
        zNear,
        zFar,
        aspectRatio = 1
    ) {


        this._fov = fov

        this._position = origin

        this._zNear = zNear
        this._zFar = zFar

        this.aspectRatio = aspectRatio
    }


    get orientation() {
        const pQuat = quat.fromEuler([], this.pitch* 57.25, 0, 0)
        const yQuat = quat.fromEuler([], 0, this.yaw * 57.25, 0)

        return quat.multiply([], yQuat, pQuat)
    }


    get zNear() {
        return this._zNear
    }

    get zFar() {
        return this._zFar
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
    set zNear(data) {
        this._zNear = data

    }

    set zFar(data) {
        this._zFar = data

    }
    get projectionMatrix() {
        return Array.from(this._projectionMatrix)
    }
    set position(data) {
        this._position = data
    }

    get position() {
        return this._position
    }

    set viewMatrix(data){
        this._viewMatrix = data
    }
    get viewMatrix(){
        return this._viewMatrix
    }


    getNotTranslatedViewMatrix() {
        let m = [...this._viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
    }


    updateViewMatrix() {}
    updatePlacement(){}

}