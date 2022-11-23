import GPU from "../../GPU";
import WORKER_MESSAGES from "../../static/WORKER_MESSAGES.json"
import LightsAPI from "../../lib/rendering/LightsAPI";

export default class TransformationPass {
    static hasChangeBuffer = new Uint8Array(new SharedArrayBuffer(1))
    static instancingNeedsUpdate = new Map()
    static threads = []
    static linkedEntities = new Map()
    static #initialized = false
    static #currentWorkerIndex = 0


    static updateEntityLinks(child, parent) {
        if(parent) {
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
        const max = Math.max(navigator.hardwareConcurrency / 2, 1)
        for (let i = 0; i < max; i++) {
            const w = new Worker("./build/movement-worker.js")
            TransformationPass.threads.push(w)
            w.onmessage = (event) => {
                if (typeof event.data === "string")
                    TransformationPass.instancingNeedsUpdate.set(event.data, GPU.instancingGroup.get(event.data))
            }
            w.postMessage({type: WORKER_MESSAGES.INITIALIZE, payload: TransformationPass.hasChangeBuffer})
        }
    }


    static removeEntity(entity) {
        const thread = TransformationPass.threads[entity.__workerGroup]
        if (!thread)
            return
        thread.postMessage({type: WORKER_MESSAGES.REMOVE_ENTITY, payload: entity.id})
        TransformationPass.linkedEntities.delete(entity.id)
        entity.__workerGroup = undefined
    }

    static registerEntity(entity) {
        if (!TransformationPass.#initialized || (entity.__workerGroup != null && TransformationPass.linkedEntities.get(entity.id)))
            return
        TransformationPass.linkedEntities.set(entity.id, entity)
        const currentThread = TransformationPass.threads[TransformationPass.#currentWorkerIndex]
        currentThread.postMessage({
            type: WORKER_MESSAGES.REGISTER_ENTITY,
            payload: {
                ...entity,
                scripts: undefined,
                children: undefined,
                parent: undefined,
                parentMatrix: entity.parent?.matrix,
                parentChangedBuffer: entity.parent?.__changedBuffer,
                components: undefined
            }
        })
        entity.changed = true
        entity.__workerGroup = TransformationPass.#currentWorkerIndex
        if (TransformationPass.#currentWorkerIndex >= TransformationPass.threads.length - 1)
            TransformationPass.#currentWorkerIndex = 0
        else
            TransformationPass.#currentWorkerIndex++

    }


}

