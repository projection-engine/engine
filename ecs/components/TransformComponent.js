import Component from "../basic/Component";
import {mat4, vec4} from "gl-matrix";

export default class TransformComponent extends Component {
    _rotation = [0, 0, 0]
    _translation = [0, 0, 0]
    _scaling = [1, 1, 1]
    changed = false
    _transformationMatrix = mat4.create()

    _position = [0, 0, 0, 1]

    constructor(id) {
        const name = TransformComponent.constructor.name
        super(id, name);
    }

    get position() {
        return [...this._position]
    }

    get rotation() {
        return [...this._rotation]
    }

    get scaling() {
        return [...this._scaling]
    }

    get translation() {
        return [...this._translation]
    }

    get transformationMatrix() {
        return this._transformationMatrix
    }

    set rotation(data) {
        this.changed = true
        this._rotation = data

    }

    set translation(data) {
        this.changed = true
        this._translation = data
    }

    set scaling(data) {
        this.changed = true
        this._scaling = data
    }

    set transformationMatrix(data) {
        this._transformationMatrix = data

        this.changed = false
    }
}