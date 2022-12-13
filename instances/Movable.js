import ArrayBufferAPI from "../lib/utils/ArrayBufferAPI";


/**
 * @field __changedBuffer {Uint8Array [changed, changesApplied, isUnderChange]} - Transferable array buffer that worker thread reads and writes in;
 * @field __workerGroup {int} - Transformation group which entity is linked to
 */

export default class Movable {
    _rotationQuat = ArrayBufferAPI.allocateVector(4, 0, true)
    _translation = ArrayBufferAPI.allocateVector(3)
    _scaling = ArrayBufferAPI.allocateVector(3, 1)
    pivotPoint = ArrayBufferAPI.allocateVector(3)
    matrix = ArrayBufferAPI.allocateMatrix(4, true)
    baseTransformationMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    previousModelMatrix = ArrayBufferAPI.allocateMatrix(4, true)
    __changedBuffer = new Uint8Array(new SharedArrayBuffer(3))
    distanceFromCamera = new Float32Array(new SharedArrayBuffer(4))
    lockedRotation = false
    lockedTranslation = false
    lockedScaling = false

    absoluteTranslation = ArrayBufferAPI.allocateVector(3)

    get position() {
        return this._translation
    }


    get scaling() {
        return this._scaling
    }

    get translation() {
        return this._translation
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
    get isUnderChange(){
        return this.__changedBuffer[2] === 1
    }
}