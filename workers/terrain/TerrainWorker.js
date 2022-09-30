export default class TerrainWorker {
    static #initialized = false
    static #worker


    static initialize() {
        if (TerrainWorker.#initialized)
            return
        TerrainWorker.#initialized = true
        TerrainWorker.#worker = new Worker("./build/terrain-worker.js")
    }

    static generate(base64, scale, dimensions) {
        return new Promise(resolve => {
            TerrainWorker.#worker.postMessage({base64, scale, dimensions})
            TerrainWorker.#worker.onmessage = ({data}) => resolve(data)
        })
    }
}