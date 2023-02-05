import {mat4, quat, vec3} from "gl-matrix";
import DynamicMap from "../resource-libs/DynamicMap";
import Movable from "../instances/components/Movable";

/**
 * @field controlBuffer {Uint8Array [hasUpdatedItem]} - Transferred array from MovementWorker, will be written to in case of changes to linked entities.
 */

const MIN_SCALE = 5e-10
const EMPTY_QUATERNION = quat.create()
const cacheDistance = vec3.create()
export default class TransformationPass {
    static targets = new DynamicMap<WorkerEntity>()
    static controlBuffer?: Float32Array
    static cameraPosition?: Float32Array
    static cameraBuffer?: Float32Array
    static #initialized = false
    static index = -1
    static maxWorkers = -1
    static threadEntityOffset = 0
    static threadMaxEntities = 0
    static cache = 0

    static initialize([controlBuffer, cameraBuffer, cameraPosition, index, maxWorkers]) {
        if (TransformationPass.#initialized)
            return

        TransformationPass.maxWorkers = maxWorkers
        TransformationPass.index = index
        TransformationPass.cameraPosition = cameraPosition
        TransformationPass.cameraBuffer = cameraBuffer
        TransformationPass.controlBuffer = controlBuffer
        TransformationPass.#initialized = true
    }

    static updateThreadInfo() {
        TransformationPass.threadMaxEntities = Math.ceil(TransformationPass.targets.array.length / TransformationPass.maxWorkers)
        TransformationPass.threadEntityOffset = TransformationPass.index * TransformationPass.threadMaxEntities

    }

    static execute() {
        if (!TransformationPass.#initialized)
            return
        const entities = TransformationPass.targets.array
        const size = entities.length
        const hasToUpdate = TransformationPass.cache === 4
        for (let i = 0; i < size; i++) {
            const entity = entities[i]
            /**
             * Skip if is under change from other thread
             */
            if (entity.changedBuffer[2])
                continue
            if (!entity.changedBuffer[0] && (!entity.parentChangedBuffer || !entity.parentChangedBuffer[1])) {
                entity.changedBuffer[1] = 0
                if (entity.needsCacheUpdate) {
                    entity.needsCacheUpdate = false
                    mat4.copy(entity.previousModelMatrix, entity.matrix)
                }
                continue
            }

            TransformationPass.controlBuffer[0] = 1
            entity.changedBuffer[1] = 1
            TransformationPass.transform(entity)
        }
        TransformationPass.cache++
        if (hasToUpdate) {
            TransformationPass.cache = 0
            for (let i = 0; i < TransformationPass.threadMaxEntities; i++) {
                const entity = entities[i + TransformationPass.threadEntityOffset]
                if (!entity)
                    continue
                if (entity.changedBuffer[1] || TransformationPass.cameraBuffer[3]) {
                    const cullingBuffer = entity.cullingMetadata

                    cullingBuffer[0] = vec3.length(vec3.sub(cacheDistance, entity.absoluteTranslation, TransformationPass.cameraPosition))

                    const distanceFromCamera = cullingBuffer[0]
                    const cullingDistance = cullingBuffer[1]
                    const hasDistanceCullingEnabled = cullingBuffer[2]
                    const screenDoorDistance = cullingBuffer[4]

                    cullingBuffer[3] = hasDistanceCullingEnabled && distanceFromCamera > cullingDistance ? 1 : 0

                    cullingBuffer[5] = screenDoorDistance < distanceFromCamera ? 1 : 0
                }
            }
        }
    }

    static transform(entity: WorkerEntity) {
        entity.changedBuffer[2] = 1
        entity.changedBuffer[0] = 0
        const scaling = entity.scaling
        if (scaling[0] === 0)
            scaling[0] = MIN_SCALE
        if (scaling[1] === 0)
            scaling[1] = MIN_SCALE
        if (scaling[2] === 0)
            scaling[2] = MIN_SCALE

        mat4.copy(entity.previousModelMatrix, entity.matrix)
        entity.needsCacheUpdate = true
        if (entity.rotationType[0] === Movable.ROTATION_QUATERNION)
            quat.normalize(entity.rotationQuaternionFinal, entity.rotationQuaternion)

        else {
            quat.copy(entity.rotationQuaternionFinal, EMPTY_QUATERNION)
            switch (entity.rotationType[0]) {
                case Movable.ROTATION_EULER_XZY:
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    break
                case Movable.ROTATION_EULER_XYZ:
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])
                    break
                case Movable.ROTATION_EULER_YZX:
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    break
                case Movable.ROTATION_EULER_YXZ:
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    break
                case Movable.ROTATION_EULER_ZXY:
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])

                    break
                case Movable.ROTATION_EULER_ZYX:
                    quat.rotateZ(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[2])
                    quat.rotateY(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[1])
                    quat.rotateX(entity.rotationQuaternionFinal, entity.rotationQuaternionFinal, entity.rotationEuler[0])
                    break
            }
        }
        mat4.fromRotationTranslationScaleOrigin(entity.matrix, entity.rotationQuaternionFinal, entity.translation, scaling, entity.pivotPoint)
        // mat4.multiply(entity.matrix, entity.matrix, )

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
        entity.changedBuffer[2] = 0
    }
}