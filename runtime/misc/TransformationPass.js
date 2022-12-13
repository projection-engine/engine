import {mat4, quat} from "gl-matrix";

/**
 * @field controlBuffers {Uint8Array [hasUpdatedItem]} - Transferred array from MovementWorker, will be written to in case of changes to linked entities.
 */

const MIN_SCALE = 5e-10
const cache = quat.create()

export default class TransformationPass {
    static targets = []
    static controlBuffers
    static #initialized = false
    static workerSender

    static initialize(controlBuffers, workerSender) {
        if (TransformationPass.#initialized)
            return

        TransformationPass.controlBuffers = controlBuffers
        TransformationPass.workerSender = workerSender
        TransformationPass.#initialized = true

    }

    static execute() {
        if (!TransformationPass.#initialized)
            return
        const entities = TransformationPass.targets
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

            TransformationPass.controlBuffers[0] = 1
            current.__changedBuffer[1] = 1
            TransformationPass.transform(current)
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