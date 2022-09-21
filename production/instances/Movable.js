import {quat} from "gl-matrix"
import TransformationAPI from "../apis/math/TransformationAPI"
import TRANSFORMATION_PROPS from "../../static/component-props/TRANSFORMATION_PROPS";
import Component from "../components/Component";
import SharedBufferAPI from "../apis/SharedBufferAPI";


/**
 * @field __changedBuffer {Uint8Array [needsUpdate, wasUpdated]} - Transferable array buffer that worker thread reads and writes in;
 * @field __workerGroup {int} - Transformation group which entity is linked to
 */


const toDeg = 57.29
export default class Movable extends Component {
    _props = TRANSFORMATION_PROPS
    _rotationQuat = SharedBufferAPI.allocateVector(4, 0, true)
    _translation = SharedBufferAPI.allocateVector(3)
    _scaling = SharedBufferAPI.allocateVector(3, 1)
    pivotPoint = SharedBufferAPI.allocateVector(3)

    matrix = SharedBufferAPI.allocateMatrix(4, true)
    baseTransformationMatrix = SharedBufferAPI.allocateMatrix(4, true)
    collisionTransformationMatrix = SharedBufferAPI.allocateMatrix(4, true)
    __changedBuffer = new Uint8Array(new SharedArrayBuffer(2))


    normalMatrix = SharedBufferAPI.allocateMatrix(3)
    absoluteTranslation = SharedBufferAPI.allocateVector(3)
    __workerGroup

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

    set rotation(data) {
        this.__changedBuffer[0] = 1
        quat.fromEuler(this._rotationQuat, data[0] * toDeg, data[1] * toDeg, data[2] * toDeg)
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