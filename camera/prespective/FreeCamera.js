import {linearAlgebraMath, Vector} from 'pj-math'
import {lookAt} from "../../utils/utils";
import conf from "../../config.json";
import Camera from "../Camera";
import {mat4} from "gl-matrix";

export default class FreeCamera extends Camera {
    direction = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false, down: false
    }

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
        // mat4.ortho(this._projectionMatrix, -this._fov * 180/Math.PI, this._fov * 180/Math.PI, -this._fov * 180/Math.PI, this._fov * 180/Math.PI, this._zNear, this._zFar);
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
    get yaw(){
        return this._yaw
    }
    get pitch(){
        return this._pitch
    }

    updatePlacement() {
        super.updatePlacement()
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

