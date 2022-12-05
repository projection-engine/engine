import WORKER_MESSAGES from "../static/WORKER_MESSAGES.json"
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

    static initialize(controlBuffers, workerSender) {
        if (MovementPass.#initialized)
            return

        MovementPass.controlBuffers = controlBuffers
        MovementPass.workerSender = workerSender
        MovementPass.#initialized = true

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
                if(current.needsCacheUpdate){
                    current.needsCacheUpdate = false
                    mat4.copy(current.previousModelMatrix, current.matrix)
                }
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

        mat4.copy(entity.previousModelMatrix, entity.matrix)
        entity.needsCacheUpdate = true
        quat.normalize(cache, entity._rotationQuat)
        mat4.fromRotationTranslationScaleOrigin(entity.matrix, cache, entity._translation, scaling, entity.pivotPoint)

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
    }
}


self.onmessage = (event) => {
    if(event.data){
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
    else
        MovementPass.execute()
}