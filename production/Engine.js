import CameraAPI from "./apis/CameraAPI"
import ENVIRONMENT from "./data/ENVIRONMENT"
import LoopController from "./controllers/LoopController";

export default class Engine {
    static entitiesMap = new Map()
    static entities = []
    static environment = ENVIRONMENT.DEV
    static data = {}
    static params = {}
    static queryMap = new Map()
    static then = 0
    static frameID
    static isReady = false


    static initialize() {
        LoopController.initialize()
            .then(() => {
                new ResizeObserver(() => {
                    const bBox = gpu.canvas.getBoundingClientRect()
                    CameraAPI.metadata.aspectRatio = bBox.width / bBox.height
                    CameraAPI.updateProjection()
                }).observe(gpu.canvas)
                Engine.isReady = true
                Engine.start()
            })
    }

    static #callback() {
        Engine.params.elapsed = performance.now() - Engine.then
        LoopController.loop(Engine.entities)
        Engine.frameID = requestAnimationFrame(() => Engine.#callback())
    }

    static start() {
        if (!Engine.frameID && Engine.isReady)
            Engine.frameID = requestAnimationFrame(() => Engine.#callback())
    }

    static stop() {
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
