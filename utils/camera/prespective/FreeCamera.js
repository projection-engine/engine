import {linearAlgebraMath, Vector} from 'pj-math'
import {lookAt} from "../../misc/utils";
import conf from "../../../assets/config.json";
import Camera from "../Camera";
import {mat4, vec4} from "gl-matrix";

export default class FreeCamera extends Camera {
    direction = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false, down: false
    }
    onMove

    forwardVelocity = 0
    sideVelocity = 0
    upVelocity = 0
    constructor(
        origin,
        fov,
        zNear,
        zFar,
        aspectRatio,
        type
    ) {
        super(
            origin,
            fov,
            zNear,
            zFar,
            aspectRatio,
            type);

        this.updateProjection()
        this.updateViewMatrix()
    }

    // FOV - ASPECT - PROJECTION
    get fov() {
        return this._fov
    }

    set fov(data) {
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

    updateProjection() {

        mat4.perspective(this._projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }

    updateViewMatrix() {
        super.updateViewMatrix()
        this.viewMatrix = lookAt(this._yaw, this._pitch, this._position)
    }

    set yaw(data) {
        this._yaw = data
    }

    set pitch(data) {
        this._pitch = data
    }

    get yaw() {
        return this._yaw
    }

    get pitch() {
        return this._pitch
    }

    updatePlacement() {
        super.updatePlacement()
        let changed = false

        if (this.direction.forward) {
            changed = true
            if (this.forwardVelocity <= 1)
                this.forwardVelocity += .005
            const z = this.forwardVelocity
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix

            this._position[0] += newPosition[0]
            this._position[1] += Math.sin(this._pitch )
            this._position[2] -= newPosition[2]

        }
        if (this.direction.backward) {
            changed = true
            if (this.forwardVelocity <= 1)
                this.forwardVelocity += .005
            const z = -this.forwardVelocity
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix


            this._position[0] += newPosition[0]
            this._position[1] -= Math.sin(this._pitch )
            this._position[2] -= newPosition[2]
        }
        if (this.direction.left) {
            changed = true
            if (this.sideVelocity <= 1)
                this.sideVelocity += .005

            const x = this.sideVelocity
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this._position[0] -= newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] += newPosition[2]
        }
        if (this.direction.right) {
            changed = true
            if (this.sideVelocity <= 1)
                this.sideVelocity += .005

            const x = -this.sideVelocity

            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this._position[0] -= newPosition[0]
            this._position[1] += newPosition[1]
            this._position[2] += newPosition[2]
        }
        if (this.direction.up) {
            changed = true
            if (this.upVelocity <= 1)
                this.upVelocity += .005


            const y = this.upVelocity
            this._position[1] += y

        }
        if (this.direction.down) {
            changed = true
            if (this.upVelocity <= 1)
                this.upVelocity += .005


            const y = this.upVelocity
            this._position[1] -= y
        }

        if (changed) {
            this.updateViewMatrix()
            if (this.onMove)
                this.onMove()

        } else {
            this.forwardVelocity = 0
            this.sideVelocity = 0
            this.upVelocity = 0
        }
    }
}

