import {lookAt} from "../../utils/utils";
import Camera from "../Camera";
import {mat4} from "gl-matrix";

export const DIRECTIONS = {
    TOP: 0,
    BOTTOM: 1,
    LEFT: 2,
    RIGHT: 3,
    FRONT: 4,
    BACK: 5
}
export default class OrthographicCamera extends Camera {
    direction = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false
    }
    _size = 100

    constructor(
        zNear,
        zFar,
        aspectRatio,
        direction
    ) {
        let placement
        switch (direction) {
            case DIRECTIONS.TOP:
                placement = [0, 1000, 0]
                break
            case DIRECTIONS.BOTTOM:
                placement = [0, -1000, 0]
                break
            case DIRECTIONS.LEFT:
                placement = [-1000, 0, 0]
                break
            case DIRECTIONS.RIGHT:
                placement = [1000, 0, 0]
                break
            case DIRECTIONS.FRONT:
                placement = [0, 0, 1000]
                break
            case DIRECTIONS.BACK:
                placement = [0, 0, -1000]
                break
        }
        super(
            placement,
            undefined,
            zNear,
            zFar,
            aspectRatio,
        );

        this.direction = direction
    }

    get size() {
        return this._size
    }

    set size(data) {

        this._size = data
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
        mat4.ortho(this._projectionMatrix, -this._size, this._size, -this._size / this._aspectRatio, this._size / this._aspectRatio, this._zNear, this._zFar);
    }

    get direction() {
        return this._direction
    }

    set direction(data) {
        this._direction = data

        switch (data) {
            case DIRECTIONS.TOP:
                this._yaw = 0
                this._pitch = -1.57
                break
            case DIRECTIONS.BOTTOM:
                this._yaw = 0
                this._pitch = 1.57
                break
            case DIRECTIONS.LEFT:
                this._yaw = -1.57
                this._pitch = 0
                break
            case DIRECTIONS.RIGHT:
                this._yaw = 1.57
                this._pitch = 0
                break
            case DIRECTIONS.FRONT:
                this._yaw = 0
                this._pitch = 0
                break
            case DIRECTIONS.BACK:
                this._yaw = Math.PI
                this._pitch = 0
                break
        }
        this.updateViewMatrix()
    }

    updateViewMatrix() {
        super.updateViewMatrix()
        this.viewMatrix = lookAt(this._yaw, this._pitch, this._position)

        let c = [...this._position]
        let yaw = 0, pitch = 1.57
        const offset = .8
        switch (this.direction) {
            case DIRECTIONS.TOP:
                yaw = this._yaw
                pitch = this._pitch
                break
            case DIRECTIONS.BOTTOM:
                yaw = this._yaw
                pitch = this._pitch
                break
            case DIRECTIONS.LEFT:
                c[0] = c[2]- offset
                c[1] = this._position[0]
                c[2] = this._position[1] + offset

                break
            case DIRECTIONS.RIGHT:
                c[0] = -c[2]+ offset
                c[1] = this._position[0]
                c[2] = -this._position[1]+ offset

                pitch = -1.57
                break
            case DIRECTIONS.FRONT:
                c[0] = this._position[0]
                c[1] = c[2]
                c[2] = -this._position[1] - offset/4

                pitch = -1.57
                break
            case DIRECTIONS.BACK:
                c[0] = -this._position[0]
                c[1] = -c[2]
                c[2] = -this._position[1] - offset/4

                pitch = -1.57

                break
        }


        this.viewMatrixGrid = lookAt(yaw, pitch, c)
    }
}

