import WORKER_MESSAGES from "../../static/WORKER_MESSAGES"
import CameraAPI from "./CameraAPI";


let maxWorkers
let currentActiveWorker = 0
export default class EntityWorkerAPI {
    static hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))

    static linkedEntities = new Map()
    static #initialized = false
    static #workers = []


    static updateEntityLinks(child, parent) {
        if (parent) {
            EntityWorkerAPI.removeEntity(parent)
            EntityWorkerAPI.registerEntity(parent)
        }

        EntityWorkerAPI.removeEntity(child)
        EntityWorkerAPI.registerEntity(child)
    }


    static initialize() {
        if (EntityWorkerAPI.#initialized)
            return
        EntityWorkerAPI.#initialized = true
        maxWorkers = Math.max(navigator.hardwareConcurrency - 2, 1)
        for (let i = 0; i < maxWorkers; i++) {
            const currentWorker = new Worker("./entity-worker.js")
            currentWorker.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: [EntityWorkerAPI.hasChangeBuffer, CameraAPI.notificationBuffers, CameraAPI.position, i, maxWorkers]})
            EntityWorkerAPI.#workers.push(currentWorker)
        }
    }


    static removeEntity(entity) {
        if (!entity.__hasWorkerBinded)
            return
        EntityWorkerAPI.#workers.forEach(worker => {
            worker.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        })

        EntityWorkerAPI.linkedEntities.delete(entity.id)
        entity.__hasWorkerBinded = false
    }

    static registerEntity(entity) {
        if (!EntityWorkerAPI.#initialized || (entity.__hasWorkerBinded && EntityWorkerAPI.linkedEntities.get(entity.id)))
            return
        EntityWorkerAPI.linkedEntities.set(entity.id, entity)

        const newEntity = <WorkerEntity> {
            id: entity.id,
            __changedBuffer: entity.__changedBuffer,
            previousModelMatrix: entity.previousModelMatrix,
            matrix: entity.matrix,
            parentChangedBuffer: entity.parent?.__changedBuffer,
            _rotationQuat: entity._rotationQuat,
            _translation: entity._translation,
            _scaling: entity._scaling,
            pivotPoint: entity.pivotPoint,
            baseTransformationMatrix: entity.baseTransformationMatrix,
            absoluteTranslation: entity.absoluteTranslation,
            parentMatrix: entity.parent?.matrix,
            cullingMetadata: entity.__cullingMetadata
        }

        EntityWorkerAPI.#workers.forEach(worker => {
            worker.postMessage({
                type: WORKER_MESSAGES.REGISTER_ENTITY,
                payload: newEntity
            })
        })

        entity.changed = true
        entity.__hasWorkerBinded = true
    }

    static syncThreads() {
        if (currentActiveWorker >= maxWorkers)
            currentActiveWorker = 0
        const worker = EntityWorkerAPI.#workers[currentActiveWorker]
        worker.postMessage(0)
        currentActiveWorker++
    }
}

