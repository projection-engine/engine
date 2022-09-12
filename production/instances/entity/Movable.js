import {mat3, mat4, quat, vec3} from "gl-matrix"
import TransformationAPI from "../../apis/TransformationAPI"
import TRANSFORMATION_PROPS from "../../../static/component-props/TRANSFORMATION_PROPS";
import Component from "../../components/Component";

const toDeg = 57.29
export default class Movable extends Component {
    _props = TRANSFORMATION_PROPS
    _rotationQuat = quat.create()
    _translation = vec3.create()
    _scaling = vec3.create()
    pivotPoint = vec3.create()
    changed = false
    matrix = mat4.create()
    baseTransformationMatrix = mat4.create()
    collisionTransformationMatrix

    lockedTranslation = false
    lockedRotation = false
    lockedScaling = false
    normalMatrix = mat3.create()
    absoluteTranslation = vec3.create()

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


    get rotationQuaternion() {
        return this._rotationQuat
    }

    set rotationQuaternion(q) {
        this.changed = true
        quat.normalize(this._rotationQuat, q)
    }

    set rotation(data) {
        this.changed = true
        quat.fromEuler(this._rotationQuat, data[0] * toDeg, data[1] * toDeg, data[2] * toDeg)
    }

    set translation(data) {
        this.changed = true
        this._translation = data
    }

    set scaling(data) {
        this.changed = true
        this._scaling = data
    }

}