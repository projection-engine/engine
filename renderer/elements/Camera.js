import {linearAlgebraMath, Vector} from 'pj-math'
import {lookAt} from "../../utils/utils";
import conf from "../../../config.json";

export default class Camera {
    position = [0, 0, 0]
    yaw = 0
    pitch = 0
    viewMatrix = linearAlgebraMath.generateMatrix(4, 4, 0)
    direction = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false, down: false
    }

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

    updatePlacement() {
        let changed = false
        if (this.direction.forward) {
            changed = true
            const z = conf.sensitivity.forwards ? conf.sensitivity.forwards : 1
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix

            this.position[0] += newPosition[0]
            this.position[1] += newPosition[1]
            this.position[2] -= newPosition[2]

        }
        if (this.direction.backward) {
            changed = true
            const z = -(conf.sensitivity.forwards ? conf.sensitivity.forwards : 1)
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(0, 0, z))
            newPosition = newPosition.matrix

            this.position[0] += newPosition[0]
            this.position[1] += newPosition[1]
            this.position[2] -= newPosition[2]
        }
        if (this.direction.left) {
            changed = true
            const x = conf.sensitivity.right ? conf.sensitivity.right : 1
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this.position[0] -= newPosition[0]
            this.position[1] += newPosition[1]
            this.position[2] += newPosition[2]
        }
        if (this.direction.right) {
            changed = true
            const x = -(conf.sensitivity.right ? conf.sensitivity.right : 1)
            let newPosition = linearAlgebraMath.multiplyMatrixVec(linearAlgebraMath.rotationMatrix('y', this.yaw), new Vector(x, 0, 0))
            newPosition = newPosition.matrix

            this.position[0] -= newPosition[0]
            this.position[1] += newPosition[1]
            this.position[2] += newPosition[2]
        }
        if (this.direction.up) {
            changed = true
            const y = (conf.sensitivity.up ? conf.sensitivity.up : 1)
            this.position[1] += y

        }
        if (this.direction.down) {
            changed = true
            const y = (conf.sensitivity.up ? conf.sensitivity.up : 1)
            this.position[1] -= y
        }


        if (changed)
            this.updateViewMatrix()
    }
}

