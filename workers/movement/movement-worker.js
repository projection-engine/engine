import WORKER_MESSAGES from "../../static/WORKER_MESSAGES.json"
import {mat4, quat} from "gl-matrix";

/**
 * @field controlBuffers {Uint8Array [hasUpdatedItem]} - Transferred array from MovementWorker, will be written to in case of changes to linked entities.
 */

const MIN_SCALE = 5e-10
const cache = quat.create()
class MovementPass {
    static targets = []
    static controlBuffers
    static #initialized = false
    static workerSender
    static frameID

    static initialize(controlBuffers, workerSender) {
        if (MovementPass.#initialized)
            return

        MovementPass.controlBuffers = controlBuffers
        MovementPass.workerSender = workerSender
        MovementPass.#initialized = true
        const callback = () => {
            MovementPass.execute()
            MovementPass.frameID = requestAnimationFrame(callback)
        }
        MovementPass.frameID = requestAnimationFrame(callback)
    }

    static execute() {
        if (!MovementPass.#initialized)
            return
        const entities = MovementPass.targets
        const size = entities.length

        for (let i = 0; i < size; i++) {
            const current = entities[i]

            if (!current.__changedBuffer[0] && (!current.parentChangedBuffer || !current.parentChangedBuffer[1])) {
                current.__changedBuffer[1] = 0
                continue
            }

            MovementPass.controlBuffers[0] = 1
            current.__changedBuffer[1] = 1
            MovementPass.transform(current)
        }
    }

    static transform(entity) {
        entity.__changedBuffer[0] = 0
        const scaling = entity._scaling
        if (scaling[0] === 0)
            scaling[0] = MIN_SCALE
        if (scaling[1] === 0)
            scaling[1] = MIN_SCALE
        if (scaling[2] === 0)
            scaling[2] = MIN_SCALE

        quat.normalize(cache, entity._rotationQuat)
        mat4.fromRotationTranslationScale(entity.matrix, cache, entity._translation, scaling)
        mat4.multiply(entity.matrix, entity.matrix, entity.baseTransformationMatrix)

        if (entity.parentMatrix)
            mat4.multiply(
                entity.matrix,
                entity.parentMatrix,
                entity.matrix
            )

        entity.absoluteTranslation[0] = entity.matrix[12]
        entity.absoluteTranslation[1] = entity.matrix[13]
        entity.absoluteTranslation[2] = entity.matrix[14]

        MovementPass.normalMatrix(entity.normalMatrix, entity.matrix)
        if (entity.instancingGroupID)
            MovementPass.workerSender.postMessage(entity.instancingGroupID)
    }

    static normalMatrix(previous, matrix) {
        let a00 = matrix[0], a01 = matrix[1], a02 = matrix[2], a03 = matrix[3],
            a10 = matrix[4], a11 = matrix[5], a12 = matrix[6], a13 = matrix[7],
            a20 = matrix[8], a21 = matrix[9], a22 = matrix[10], a23 = matrix[11],
            a30 = matrix[12], a31 = matrix[13], a32 = matrix[14], a33 = matrix[15],
            b00 = a00 * a11 - a01 * a10,
            b01 = a00 * a12 - a02 * a10,
            b02 = a00 * a13 - a03 * a10,
            b03 = a01 * a12 - a02 * a11,
            b04 = a01 * a13 - a03 * a11,
            b05 = a02 * a13 - a03 * a12,
            b06 = a20 * a31 - a21 * a30,
            b07 = a20 * a32 - a22 * a30,
            b08 = a20 * a33 - a23 * a30,
            b09 = a21 * a32 - a22 * a31,
            b10 = a21 * a33 - a23 * a31,
            b11 = a22 * a33 - a23 * a32,
            det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06
        if (!det)
            return
        det = 1.0 / det

        previous[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det
        previous[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det
        previous[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det

        previous[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det
        previous[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det
        previous[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det

        previous[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det
        previous[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det
        previous[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det
    }
}


self.onmessage = (event) => {
    const {type, payload} = event.data
    switch (type) {
        case WORKER_MESSAGES.INITIALIZE:
            MovementPass.initialize(payload, self)
            break
        case WORKER_MESSAGES.REGISTER_ENTITY:
            MovementPass.targets.push(payload)
            break
        case WORKER_MESSAGES.REMOVE_ENTITY:
            MovementPass.targets = MovementPass.targets.filter(e => e.id !== payload)
            break
        default:
            break
    }
}