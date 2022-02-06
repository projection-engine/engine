import {linearAlgebraMath} from "pj-math";
import {mat4} from "gl-matrix";

export default class Camera{
    _position = [0, 0, 0]
    _yaw = 0
    _pitch = 0
    viewMatrix = linearAlgebraMath.generateMatrix(4, 4, 0)
    direction = {}
    _fov = Math.PI/2
    _projectionMatrix = mat4.create()
    constructor(

        origin = [0, 0, 0],
        fov,
        zNear,
        zFar,
        aspectRatio = 1
    ) {


        this._fov = fov
        this._aspectRatio = aspectRatio
        this._position = origin

        this._zNear = zNear
        this.zFar = zFar

        this.updateViewMatrix()
    }

    set fov(data){
        this._fov = data
        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }
    get fov (){
        return this._fov
    }
    set aspectRatio(data) {
        this._aspectRatio = data
        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)

    }

    get aspectRatio() {
        return this._aspectRatio
    }

    get zNear() {
        return this._zNear
    }

    get zFar() {
        return this._zFar
    }

    set zNear(data) {
        this._zNear = data
        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }

    set zFar(data) {
        this._zFar = data
        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }

    get projectionMatrix() {
        return Array.from(this._projectionMatrix)
    }

    get position() {
        return this._position
    }

    getNotTranslatedViewMatrix() {

        let m = [...this.viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
    }


    updateViewMatrix() {}
    updatePlacement(){}

}