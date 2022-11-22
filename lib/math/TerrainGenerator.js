export default class TerrainGenerator {
    static #initialized = false
    static #worker

    static initialize() {
        if (TerrainGenerator.#initialized)
            return
        TerrainGenerator.#initialized = true
        TerrainGenerator.#worker = new Worker("./build/terrain-worker.js")
    }

    static generate(base64, scale, dimensions) {
        return new Promise(resolve => {
            TerrainGenerator.#worker.postMessage({base64, scale, dimensions})
            TerrainGenerator.#worker.onmessage = ({data}) => resolve(data)
        })
    }
}