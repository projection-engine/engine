import GPU from "../../GPU";
import WORKER_MESSAGES from "../../static/WORKER_MESSAGES.json"

let w
export default class TransformationPass {
    static hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))
    static instancingNeedsUpdate = new Map()
    static worker
    static linkedEntities = new Map()
    static #initialized = false

    static updateEntityLinks(child, parent) {
        if (parent) {
            TransformationPass.removeEntity(parent)
            TransformationPass.registerEntity(parent)
        }

        TransformationPass.removeEntity(child)
        TransformationPass.registerEntity(child)
    }


    static initialize() {
        if (TransformationPass.#initialized)
            return

        TransformationPass.#initialized = true
        w = new Worker("./build/movement-worker.js")
        TransformationPass.worker = w
        w.onmessage = (event) => {
            if (typeof event.data === "string")
                TransformationPass.instancingNeedsUpdate.set(event.data, GPU.instancingGroup.get(event.data))
        }
        w.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: TransformationPass.hasChangeBuffer})

    }


    static removeEntity(entity) {

        if (!entity.__hasWorkerBinded)
            return
        TransformationPass.worker.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        TransformationPass.linkedEntities.delete(entity.id)
        entity.__hasWorkerBinded = undefined
    }

    static registerEntity(entity) {
        if (!TransformationPass.#initialized || (entity.__hasWorkerBinded != null && TransformationPass.linkedEntities.get(entity.id)))
            return
        TransformationPass.linkedEntities.set(entity.id, entity)

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
        TransformationPass.worker.postMessage({
            type: WORKER_MESSAGES.REGISTER_ENTITY,
            payload: newEntity
        })
        entity.changed = true
        entity.__hasWorkerBinded = true
    }
    static execute(){
        w.postMessage(0)
    }
}

