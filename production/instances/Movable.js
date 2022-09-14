import {quat} from "gl-matrix"
import TransformationAPI from "../apis/math/TransformationAPI"
import TRANSFORMATION_PROPS from "../../static/component-props/TRANSFORMATION_PROPS";
import Component from "../components/Component";


/**
 * @field __changedBuffer {Uint8Array [needsUpdate, wasUpdated]} - Transferable array buffer that worker thread reads and writes in;
 * @field __workerGroup {int} - Transformation group which entity is linked to
 */

const S = () => {
    const b = new Float32Array(new SharedArrayBuffer(12))
    b[0] = 1
    b[1] = 1
    b[2] = 1
    return b
}
const toDeg = 57.29
export default class Movable extends Component {
    _props = TRANSFORMATION_PROPS
    _rotationQuat = new Float32Array(new SharedArrayBuffer(16))
    _translation = new Float32Array(new SharedArrayBuffer(12))
    _scaling = S()
    pivotPoint = new Float32Array(new SharedArrayBuffer(12))

    matrix = Movable.generateIdentity()
    baseTransformationMatrix = Movable.generateIdentity()
    collisionTransformationMatrix = Movable.generateIdentity()
    __changedBuffer = new Uint8Array(new SharedArrayBuffer(2))

    lockedTranslation = false
    lockedRotation = false
    lockedScaling = false

    normalMatrix = new Float32Array(new SharedArrayBuffer(48))
    absoluteTranslation = new Float32Array(new SharedArrayBuffer(12))
    __workerGroup

    static generateIdentity(){
        const buffer = new Float32Array(new SharedArrayBuffer(64))
        buffer[0] = 1
        buffer[5]= 1
        buffer[10]= 1
        buffer[15]= 1
        return buffer
    }

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
        this.__changedBuffer[0] = 1
        quat.normalize(this._rotationQuat, q)
    }

    set rotation(data) {
        this.__changedBuffer[0] = 1
        quat.fromEuler(this._rotationQuat, data[0] * toDeg, data[1] * toDeg, data[2] * toDeg)
    }

    set translation(data) {
        this.__changedBuffer[0] = 1
        this._translation = data
    }

    set scaling(data) {
        this.__changedBuffer[0] = 1
        this._scaling = data
    }

    get changed() {
        return this.__changedBuffer[0] === 1
    }

    set changed(data) {
        this.__changedBuffer[0] = data ? 1 : 0
    }

    get changesApplied() {
        return this.__changedBuffer[1] === 1
    }
}