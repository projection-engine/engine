import GPU from "../../GPU";
import WORKER_MESSAGES from "../../static/WORKER_MESSAGES.json"

let w
export default class EntityWorkerAPI {
    static hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))
    static instancingNeedsUpdate = new Map()
    static worker
    static linkedEntities = new Map()
    static #initialized = false

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
        w = new Worker("./build/entity-worker.js")
        EntityWorkerAPI.worker = w
        w.onmessage = (event) => {
            if (typeof event.data === "string")
                EntityWorkerAPI.instancingNeedsUpdate.set(event.data, GPU.instancingGroup.get(event.data))
        }
        w.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: EntityWorkerAPI.hasChangeBuffer})

    }


    static removeEntity(entity) {

        if (!entity.__hasWorkerBinded)
            return
        EntityWorkerAPI.worker.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        EntityWorkerAPI.linkedEntities.delete(entity.id)
        entity.__hasWorkerBinded = undefined
    }

    static registerEntity(entity) {
        if (!EntityWorkerAPI.#initialized || (entity.__hasWorkerBinded != null && EntityWorkerAPI.linkedEntities.get(entity.id)))
            return
        EntityWorkerAPI.linkedEntities.set(entity.id, entity)

        const newEntity = {
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
            parentMatrix: entity.parent?.matrix
        }
        EntityWorkerAPI.worker.postMessage({
            type: WORKER_MESSAGES.REGISTER_ENTITY,
            payload: newEntity
        })
        entity.changed = true
        entity.__hasWorkerBinded = true
    }
    static syncThreads(){
        w.postMessage(0)
    }
}

