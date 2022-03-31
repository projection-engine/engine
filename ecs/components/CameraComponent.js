import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import {lookAt} from "../../utils/misc/utils";

export default class CameraComponent extends Component {
    projectionMatrix = mat4.create()
    viewMatrix = mat4.create()

    _fov = 1.57
    _aspectRatio = 1

    _zNear = 10000
    _zFar = -1
    projectionChanged = false

    changed = false
    constructor(id) {
        super(id);

    }
    updateViewMatrix(position, rotation) {
        this.viewMatrix = lookAt(rotation[0],rotation[1], position)
    }
    updateProjectionMatrix() {
        if(this.projectionChanged)
            mat4.perspective(this.projectionMatrix, this._fov, this._aspectRatio, this._zNear, this._zFar)
    }

    getNotTranslatedViewMatrix() {
        let m = [...this.viewMatrix].flat()
        m[12] = m[13] = m[14] = 0
        return m
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
    get fov() {
        return this._fov
    }
    get aspectRatio() {
        return this._aspectRatio
    }

    set zNear(data) {
        this._zNear = data
        this.changed = true
        this.projectionChanged = true
    }
    set zFar(data) {
        this._zFar = data
        this.changed = true
        this.projectionChanged = true
    }
    set fov(data) {
        this._fov = data
        this.changed = true
        this.projectionChanged = true
    }
    set aspectRatio(data) {
        this._aspectRatio = data
        this.changed = true
        this.projectionChanged = true
    }

}