import {v4} from "uuid";

export default class ImageWorker {
    static #initialized = false
    static #worker
    static callbacks = []

    static initialize() {
        if (ImageWorker.#initialized)
            return

        ImageWorker.#initialized = true

        ImageWorker.#worker = new Worker("./build/image-worker.js")
        ImageWorker.#worker.onmessage = ({data: {data, id}}) => {
            const callback = ImageWorker.callbacks.find(c => c.id === id)
            if (callback) {
                callback.callback(data)
                ImageWorker.callbacks = ImageWorker.callbacks.filter(c => c.id !== id)
            }
        }

    }

    static #doWork(type, data, callback) {
        const id = v4()
        ImageWorker.callbacks.push({
            callback,
            id
        })

        ImageWorker.#worker.postMessage({data, type, id})
    }

    static async request(type, data) {
        return new Promise(resolve => ImageWorker.#doWork(type, data, (res) => resolve(res)))
    }
}