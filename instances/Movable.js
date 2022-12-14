import ArrayBufferAPI from "../lib/utils/ArrayBufferAPI";


/**
 * @field __changedBuffer {Uint8Array [changed, changesApplied, isUnderChange]} - Transferable array buffer that worker thread reads and writes in;
 * @field __cullingMetadata [distanceFromCamera, cullingDistance, hasDistanceCullingEnabled, isDistanceCulled]
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
    __cullingMetadata = new Float32Array(new SharedArrayBuffer(16))
    lockedRotation = false
    lockedTranslation = false
    lockedScaling = false

    absoluteTranslation = ArrayBufferAPI.allocateVector(3)

    get isCulled(){
        return this.__cullingMetadata[3] === 1
    }

    get distanceFromCamera(){
        return this.__cullingMetadata[0]
    }
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