import {linearAlgebraMath} from "pj-math";

export default class Camera{
    _position = [0, 0, 0]
    _yaw = 0
    _pitch = 0
    viewMatrix = linearAlgebraMath.generateMatrix(4, 4, 0)
    direction = {}


    constructor(

        origin = [0, 0, 0],
        fov,
        zNear,
        zFar,
        aspectRatio = 1
    ) {


        this.fov = fov
        this.aspectRatio = aspectRatio
        this._position = origin

        this.zNear = zNear
        this.zFar = zFar

        this.updateViewMatrix()
    }


    set aspectRatio(data) {
        this._aspectRatio = data
        this._projectionMatrix = new Float32Array(linearAlgebraMath.projectionMatrix(this.fov, this._aspectRatio, this.zScale, this.zOffset).flat())
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
        this.zScale = this._zFar / (this._zFar - this._zNear)
        this.zOffset = ((-this._zFar * this._zNear) / (this._zFar - this._zNear))

        this._projectionMatrix = new Float32Array(linearAlgebraMath.projectionMatrix(this.fov, this._aspectRatio, this.zScale, this.zOffset).flat())
    }

    set zFar(data) {
        this._zFar = data
        this.zScale = this._zFar / (this._zFar - this._zNear)
        this.zOffset = ((-this._zFar * this._zNear) / (this._zFar - this._zNear))

        this._projectionMatrix = new Float32Array(linearAlgebraMath.projectionMatrix(this.fov, this._aspectRatio, this.zScale, this.zOffset).flat())
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




    updateViewMatrix() {}
    updatePlacement(){}

}