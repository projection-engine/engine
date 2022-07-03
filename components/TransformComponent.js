import Component from "../basic/Component"
import {mat4, quat, vec3} from "gl-matrix"
import Transformation from "../utils/Transformation"

const toDeg = 57.29
const identity  = mat4.create()
export default class TransformComponent extends Component {
    __rotation = [0, 0, 0]
    _rotationQuat = [0, 0, 0, 1]
    _translation = [0, 0, 0]
    _scaling = [1, 1, 1]
    pivotPoint = [0,0,0]
    changed = false
    _transformationMatrix = identity
    _rotationUpdated = false
    baseTransformationMatrix = identity
    __initializedEuler = false
    lockedRotation = false
    lockedScaling = false
    updateQuatOnEulerChange = true

    constructor(id) {
        const name = TransformComponent.constructor.name
        super(id, name)
    }

    get centerOrigin(){
        return vec3.add([], this._translation, this.pivotPoint)
    }
    get position() {
        return this._translation
    }

    get rotation() {
        return this.__rotation
    }

    get scaling() {
        return this._scaling
    }

    get translation() {
        return this._translation
    }

    get transformationMatrix() {
        return this._transformationMatrix
    }

    get rotationQuat() {
        return this._rotationQuat
    }

    get rotationUpdated() {
        return this._rotationUpdated
    }

    set rotationQuat(q) {
        this.changed = true
        this._rotationUpdated = false
        quat.normalize(this._rotationQuat, q)
        if (this.__initializedEuler) {
            this.__initializedEuler = true
            this.__rotation = Transformation.getEuler(this._rotationQuat)
        }
    }

    set rotation(data) {
        this.changed = true
        this.__rotation = data

        this._rotationUpdated = true
        if (this.updateQuatOnEulerChange)
            this._rotationQuat = quat.fromEuler([], this.__rotation[0] * toDeg, this.__rotation[1] * toDeg, this.__rotation[2] * toDeg)
    }


    clone(){
        const newComponent = new TransformComponent()
        newComponent.rotation = [...this.rotation]
        newComponent.rotationQuat = [...this.rotationQuat]
        newComponent.translation = [...this.translation]
        newComponent.scaling = [...this.scaling]
        newComponent._transformationMatrix = [...this._transformationMatrix]
        newComponent.baseTransformationMatrix = this.baseTransformationMatrix
        newComponent.lockedRotation = this.lockedRotation
        newComponent.lockedScaling = this.lockedScaling
        newComponent.updateQuatOnEulerChange = this.updateQuatOnEulerChange

        return newComponent
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
        this._transformationMatrix = mat4.multiply([], data, this.baseTransformationMatrix)

        this.changed = false
    }
}