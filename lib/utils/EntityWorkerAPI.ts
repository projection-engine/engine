import WORKER_MESSAGES from "../../static/WORKER_MESSAGES"
import CameraAPI from "./CameraAPI";
import Entity from "../../instances/Entity";


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
        if (!entity.hasWorkerBound)
            return
        EntityWorkerAPI.#workers.forEach(worker => {
            worker.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        })

        EntityWorkerAPI.linkedEntities.delete(entity.id)
        entity.hasWorkerBound = false
    }

    static registerEntity(entity:Entity) {
        if (!EntityWorkerAPI.#initialized || (entity.hasWorkerBound && EntityWorkerAPI.linkedEntities.get(entity.id)))
            return
        EntityWorkerAPI.linkedEntities.set(entity.id, entity)

        const newEntity = <WorkerEntity> {
            id: entity.id,
            changedBuffer: entity.__changedBuffer,
            previousModelMatrix: entity.previousModelMatrix,
            matrix: <Float32Array>entity.matrix,
            parentChangedBuffer: <Uint8Array|undefined>entity.parent?.__changedBuffer,
            rotationQuaternion: <Float32Array>entity.rotationQuaternion,
            translation:<Float32Array> entity.translation,
            scaling: <Float32Array>entity.scaling,
            pivotPoint: <Float32Array>entity.pivotPoint,
            baseTransformationMatrix: <Float32Array>entity.baseTransformationMatrix,
            absoluteTranslation: <Float32Array>entity.absoluteTranslation,
            parentMatrix: <Float32Array|undefined>entity.parent?.matrix,
            cullingMetadata: <Float32Array>entity.__cullingMetadata,
            rotationType: <Float32Array>entity.rotationType,
            rotationEuler: <Float32Array>entity.rotationEuler,
            rotationQuaternionFinal: <Float32Array>entity.rotationQuaternionFinal,
        }

        EntityWorkerAPI.#workers.forEach(worker => {
            worker.postMessage({
                type: WORKER_MESSAGES.REGISTER_ENTITY,
                payload: newEntity
            })
        })

        entity.changed = true
        entity.hasWorkerBound = true
    }

    static syncThreads() {
        if (currentActiveWorker >= maxWorkers)
            currentActiveWorker = 0
        const worker = EntityWorkerAPI.#workers[currentActiveWorker]
        worker.postMessage(0)
        currentActiveWorker++
    }
}

