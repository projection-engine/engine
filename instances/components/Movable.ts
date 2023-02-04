import ArrayBufferAPI from "../../lib/utils/ArrayBufferAPI";


/**
 * @field __changedBuffer {Uint8Array [changed, changesApplied, isUnderChange]} - Transferable array buffer that worker thread reads and writes in;
 * @field __cullingMetadata [distanceFromCamera, cullingDistance, hasDistanceCullingEnabled, isDistanceCulled, screenDoorDistance, isScreenDoorEnabled]
 */

export default class Movable {
    static get ROTATION_QUATERNION(){return 0}
    static get ROTATION_EULER_XYZ(){return 1}
    static get ROTATION_EULER_XZY(){return 2}
    static get ROTATION_EULER_YXZ(){return 3}
    static get ROTATION_EULER_YZX(){return 4}
    static get ROTATION_EULER_ZXY(){return 5}
    static get ROTATION_EULER_ZYX(){return 6}

    #hasWorkerBound = false
    _rotationQuaternion = <Float32Array>ArrayBufferAPI.allocateVector(4, 0, true, true, false)
    _rotationQuaternionFinal = <Float32Array>ArrayBufferAPI.allocateVector(4, 0, true, true, false)
    _translation = <Float32Array>ArrayBufferAPI.allocateVector(3, 0, false, true, false)
    _scaling = <Float32Array>ArrayBufferAPI.allocateVector(3, 1, false, true, false)
    _rotationEuler = <Float32Array>ArrayBufferAPI.allocateVector(3, Movable.ROTATION_QUATERNION, false, true, false)
    _rotationType = <Float32Array>ArrayBufferAPI.allocateVector(1, 0, false, true, false)

    pivotPoint = <Float32Array>ArrayBufferAPI.allocateVector(3, 0, false, true, false)
    matrix = <Float32Array>ArrayBufferAPI.allocateMatrix(4, true)
    baseTransformationMatrix = <Float32Array>ArrayBufferAPI.allocateMatrix(4, true)
    previousModelMatrix = <Float32Array>ArrayBufferAPI.allocateMatrix(4, true)
    __changedBuffer = new Uint8Array(new SharedArrayBuffer(3))
    __cullingMetadata = new Float32Array(new SharedArrayBuffer(24))
    lockedRotation = false
    lockedTranslation = false
    lockedScaling = false
    absoluteTranslation = <Float32Array>ArrayBufferAPI.allocateVector(3, 0, false, true, false)

    get hasWorkerBound() {
        return this.#hasWorkerBound
    }

    set hasWorkerBound(data) {
        this.#hasWorkerBound = data
    }

    get isCulled() {
        return this.__cullingMetadata[3] === 1
    }

    get distanceFromCamera() {
        return this.__cullingMetadata[0]
    }

    get scaling() {
        return this._scaling
    }

    get translation() {
        return this._translation
    }
    get rotationType () {
        return this._rotationType
    }
    get rotationEuler() {
        return this._rotationEuler
    }   
    get rotationQuaternion() {
        return this._rotationQuaternion
    }
    get rotationQuaternionFinal() {
        return this._rotationQuaternionFinal
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

    get isUnderChange() {
        return this.__changedBuffer[2] === 1
    }
}