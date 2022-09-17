import EntityAPI from "../apis/EntityAPI";
import GPU from "../GPU";
import Engine from "../Engine";
import WORKER_MESSAGES from "./WORKER_MESSAGES.json"

export default class WorkerController {
    static #hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))
    static instancingNeedsUpdate = new Map()
    static threads = []
    static linkedEntities = new Map()
    static #initialized = false
    static #currentWorkerIndex = 0

    static get hasUpdatedItem() {
        return WorkerController.#hasChangeBuffer[0] === 1
    }

    static initialize() {
        if (WorkerController.#initialized)
            return

        WorkerController.#initialized = true
        const max = Math.max(navigator.hardwareConcurrency / 2, 1)
        for (let i = 0; i < max; i++) {
            const w = new Worker("./build/movement-worker.js")
            WorkerController.threads.push(w)
            w.onmessage = (event) => {
                if (typeof event.data === "string")
                    WorkerController.instancingNeedsUpdate.set(event.data, GPU.instancingGroup.get(event.data))
            }
            w.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: WorkerController.#hasChangeBuffer})
        }
    }


    static removeEntity(entity) {
        const thread = WorkerController.threads[entity.__workerGroup]
        if (!thread)
            return
        thread.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        WorkerController.linkedEntities.delete(entity.id)
        entity.__workerGroup = undefined
    }

    static registerEntity(entity) {
        if (!WorkerController.#initialized || (entity.__workerGroup != null && WorkerController.linkedEntities.get(entity.id)))
            return
        WorkerController.linkedEntities.set(entity.id, entity)
        const currentThread = WorkerController.threads[WorkerController.#currentWorkerIndex]
        currentThread.postMessage({
            type: WORKER_MESSAGES.REGISTER_ENTITY,
            payload: {
                ...entity,
                children: undefined,
                parent: undefined,
                parentMatrix: entity.parent?.matrix,
                parentChangedBuffer: entity.parent?.__changedBuffer,
                components: undefined
            }
        })

        entity.__workerGroup = WorkerController.#currentWorkerIndex
        if (WorkerController.#currentWorkerIndex >= WorkerController.threads.length - 1)
            WorkerController.#currentWorkerIndex = 0
        else
            WorkerController.#currentWorkerIndex++

    }

    static execute() {
        if(WorkerController.#hasChangeBuffer[0] === 1) {
            EntityAPI.packageLights(true, true)
            WorkerController.#hasChangeBuffer[0] = 0
        }

        if (WorkerController.instancingNeedsUpdate.size > 0) {
            WorkerController.instancingNeedsUpdate.forEach(i => i.updateBuffer())
            WorkerController.instancingNeedsUpdate.clear()
        }
    }

}

