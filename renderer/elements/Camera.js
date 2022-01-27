import {linearAlgebraMath, Vector} from 'pj-math'
import {lookAt} from "../../utils/utils";
import conf from "../../../config.json";
import {mat4} from "gl-matrix";

export default class Camera {
    _position = [0, 0, 0]
    _yaw = 0
    _pitch = 0
    viewMatrix = linearAlgebraMath.generateMatrix(4, 4, 0)
    direction = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false, down: false
    }


    constructor(
        canvasID,
        origin = [0, 0, 0],
        fov,
        zNear,
        zFar,
        aspectRatio = 1,
        type
    ) {
        this.canvasID = canvasID
        this.type = type

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

    get yaw(){
        return this._yaw
    }
    get pitch(){
        return this._pitch
    }
    set yaw(data) {
        this._yaw = data

        // this.position[0] = 10 * Math.sin(this._pitch)
        // this.position[1] = 10 * Math.cos(this._pitch) * Math.cos(this._yaw)
        // this.position[2] = 10 * Math.cos(this._pitch) * Math.sin(this._yaw)
    }

    set pitch(data) {
        this._pitch = data

        //
        // this.position[0] = 10 * Math.sin(this._pitch)
        // this.position[1] = 10 * Math.cos(this._pitch) * Math.cos(this._yaw)
        // this.position[2] = 10 * Math.cos(this._pitch) * Math.sin(this._yaw)
    }

    updateViewMatrix() {
        console.log()
        // mat4.lookAt(this.viewMatrix, this.position, [0,0,0], [0,1,0])
        this.viewMatrix = lookAt(this._yaw, this._pitch, this._position)
    }

    updatePlacement() {

        let changed = false
        if (this.direction.forward) {
            changed = true
            const z = conf.sensitivity.forwards ? conf.sensitivity.forwards : 1
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix

            this._position[0] += newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] -= newPosition[2]

        }
        if (this.direction.backward) {
            changed = true
            const z = -(conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix

            this._position[0] += newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] -= newPosition[2]
        }
        if (this.direction.left) {
            changed = true
            const x = conf.sensitivity.right ? conf.sensitivity.right : 1
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this._position[0] -= newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] += newPosition[2]
        }
        if (this.direction.right) {
            changed = true
            const x = -(conf.sensitivity.right ? conf.sensitivity.right : 1)
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this._position[0] -= newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] += newPosition[2]
        }
        if (this.direction.up) {
            changed = true
            const y = (conf.sensitivity.up ? conf.sensitivity.up : 1)
            this._position[1] += y

        }
        if (this.direction.down) {
            changed = true
            const y = (conf.sensitivity.up ? conf.sensitivity.up : 1)
            this._position[1] -= y
        }


        if (changed)
            this.updateViewMatrix()
    }
}

