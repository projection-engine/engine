import EntityAPI from "../../production/apis/EntityAPI";
import GPU from "../../production/GPU";
import WORKER_MESSAGES from "../../static/WORKER_MESSAGES.json"

export default class MovementWorker {
    static #hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))
    static instancingNeedsUpdate = new Map()
    static threads = []
    static linkedEntities = new Map()
    static #initialized = false
    static #currentWorkerIndex = 0

    static get hasUpdatedItem() {
        return MovementWorker.#hasChangeBuffer[0] === 1
    }

    static updateEntityLinks(child, parent) {
        if(parent) {
            MovementWorker.removeEntity(parent)
            MovementWorker.registerEntity(parent)
        }

        MovementWorker.removeEntity(child)
        MovementWorker.registerEntity(child)
    }


    static initialize() {
        if (MovementWorker.#initialized)
            return

        MovementWorker.#initialized = true
        const max = Math.max(navigator.hardwareConcurrency / 2, 1)
        for (let i = 0; i < max; i++) {
            const w = new Worker("./build/movement-worker.js")
            MovementWorker.threads.push(w)
            w.onmessage = (event) => {
                if (typeof event.data === "string")
                    MovementWorker.instancingNeedsUpdate.set(event.data, GPU.instancingGroup.get(event.data))
            }
            w.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: MovementWorker.#hasChangeBuffer})
        }
    }


    static removeEntity(entity) {
        const thread = MovementWorker.threads[entity.__workerGroup]
        if (!thread)
            return
        thread.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        MovementWorker.linkedEntities.delete(entity.id)
        entity.__workerGroup = undefined
    }

    static registerEntity(entity) {
        if (!MovementWorker.#initialized || (entity.__workerGroup != null && MovementWorker.linkedEntities.get(entity.id)))
            return
        MovementWorker.linkedEntities.set(entity.id, entity)
        const currentThread = MovementWorker.threads[MovementWorker.#currentWorkerIndex]
        currentThread.postMessage({
            type: WORKER_MESSAGES.REGISTER_ENTITY,
            payload: {
                ...entity,
                children: undefined,
                parent: undefined,

                parentTranslation: entity.parent?._translation,
                parentRotation: entity.parent?._rotationQuat,

                parentChangedBuffer: entity.parent?.__changedBuffer,
                components: undefined,
                pivotPoint: entity.pivotPoint
            }
        })

        entity.__workerGroup = MovementWorker.#currentWorkerIndex
        if (MovementWorker.#currentWorkerIndex >= MovementWorker.threads.length - 1)
            MovementWorker.#currentWorkerIndex = 0
        else
            MovementWorker.#currentWorkerIndex++

    }

    static execute() {
        if (MovementWorker.#hasChangeBuffer[0] === 1) {
            EntityAPI.packageLights(true, true)
            MovementWorker.#hasChangeBuffer[0] = 0
        }

        if (MovementWorker.instancingNeedsUpdate.size > 0) {
            MovementWorker.instancingNeedsUpdate.forEach(i => i.updateBuffer())
            MovementWorker.instancingNeedsUpdate.clear()
        }
    }

}

