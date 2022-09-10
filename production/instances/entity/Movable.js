import {mat4, quat} from "gl-matrix"
import TransformationAPI from "../../apis/TransformationAPI"
import TRANSFORMATION_PROPS from "../../data/component-props/TRANSFORMATION_PROPS";
import Component from "../../components/Component";

const toDeg = 57.29
export default class Movable extends Component{
    _props = TRANSFORMATION_PROPS
    _rotationQuat = quat.create()
    _translation = [0, 0, 0]
    _scaling = [1, 1, 1]
    pivotPoint = [0,0,0]
    changed = false
    matrix = mat4.create()
    baseTransformationMatrix = mat4.create()

    lockedTranslation = false
    lockedRotation = false
    lockedScaling = false


    get position() {
        return this._translation
    }

    get rotation() {
        return TransformationAPI.getEuler(this.rotationQuaternion)
    }

    get scaling() {
        return this._scaling
    }
    get translation() {
        return this._translation
    }

    get transformationMatrix() {
        return this.matrix
    }

    get rotationQuaternion() {
        return this._rotationQuat
    }

    set rotationQuaternion(q) {
        this.changed = true
        this._rotationUpdated = false
        quat.normalize(this._rotationQuat, q)
    }

    set rotation(data) {
        this.changed = true
        quat.fromEuler(this._rotationQuat , data[0] * toDeg, data[1] * toDeg, data[2] * toDeg)
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
        mat4.multiply(this.matrix, data, this.baseTransformationMatrix)
        this.changed = false
    }
}