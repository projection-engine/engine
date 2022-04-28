import {lookAt} from "../../../utils/utils";
import Camera from "../Camera";
import {mat4, vec3} from "gl-matrix";

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
        let t = [0, 0, 0]

        if (this.direction.forward) {
            changed = true
            if (this.forwardVelocity <= 1)
                this.forwardVelocity += .01
            t[2] = -this.forwardVelocity
        }
        if (this.direction.backward) {
            changed = true
            if (this.forwardVelocity <= 1)
                this.forwardVelocity += .01
            t[2] = this.forwardVelocity
        }
        if (this.direction.left) {
            changed = true
            if (this.sideVelocity <= 1)
                this.sideVelocity += .01
            t[0] = -this.sideVelocity
        }
        if (this.direction.right) {
            changed = true
            if (this.sideVelocity <= 1)
                this.sideVelocity += .01
            t[0] = this.sideVelocity
        }
        if (this.direction.up) {
            changed = true
            if (this.upVelocity <= 1)
                this.upVelocity += .01


            const y = this.upVelocity
            t[1] += y

        }
        if (this.direction.down) {
            changed = true
            if (this.upVelocity <= 1)
                this.upVelocity += .01
            const y = this.upVelocity
            t[1] -= y
        }

        if (changed) {

            vec3.transformQuat(t, t, this.orientation);

            vec3.add(this.position, this.position, t)
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

