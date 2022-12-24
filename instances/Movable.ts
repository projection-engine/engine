import ArrayBufferAPI from "../lib/utils/ArrayBufferAPI";


/**
 * @field __changedBuffer {Uint8Array [changed, changesApplied, isUnderChange]} - Transferable array buffer that worker thread reads and writes in;
 * @field __cullingMetadata [distanceFromCamera, cullingDistance, hasDistanceCullingEnabled, isDistanceCulled, screenDoorDistance, isScreenDoorEnabled]
 */

export default class Movable {
    _rotationQuat = <Float32Array>ArrayBufferAPI.allocateVector(4, 0, true, true, false)
    _translation = <Float32Array>ArrayBufferAPI.allocateVector(3, 0, false, true, false)
    _scaling = <Float32Array>ArrayBufferAPI.allocateVector(3, 1, false, true, false)
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