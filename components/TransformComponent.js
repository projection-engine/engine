import Component from "../libs/basic/Component"
import {mat4, quat, vec3} from "gl-matrix"
import Transformation from "../services/Transformation"
import TRANSFORMATION_PROPS from "../data/component-props/TRANSFORMATION_PROPS";

const toDeg = 57.29
export default class TransformComponent extends Component {
    get isNative(){
        return true
    }
    _props = TRANSFORMATION_PROPS

    __rotation = [0, 0, 0]
    _rotationQuat = quat.create()
    _translation = [0, 0, 0]
    _scaling = [1, 1, 1]
    pivotPoint = [0,0,0]
    changed = false

    _transformationMatrix = mat4.create()
    baseTransformationMatrix = mat4.create()

    _rotationUpdated = false

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
        return Transformation.getEuler(this.rotationQuat)
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
            quat.fromEuler(this._rotationQuat , this.__rotation[0] * toDeg, this.__rotation[1] * toDeg, this.__rotation[2] * toDeg)
    }


    clone(){
        const newComponent = new TransformComponent()
        newComponent.rotation = [...this.rotation]
        newComponent.rotationQuat = [...this.rotationQuat]
        newComponent.translation = [...this.translation]
        newComponent.scaling = [...this.scaling]
        newComponent._transformationMatrix = [...this._transformationMatrix]
        newComponent.baseTransformationMatrix = [...this.baseTransformationMatrix]
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
        mat4.multiply(this._transformationMatrix, data, this.baseTransformationMatrix)
        this.changed = false
    }
}