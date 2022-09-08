import CameraAPI from "./apis/CameraAPI"
import ENVIRONMENT from "./data/ENVIRONMENT"
import LoopController from "./controllers/LoopController";

export default class Engine {

    static entitiesMap = new Map()

    entities = []
    materials = []

    static environment = ENVIRONMENT.DEV

    static data = {}
    static params = {}
    static queryMap = new Map()
    static then = 0
    static frameID

    constructor() {
        LoopController.initialize()

        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            CameraAPI.metadata.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        }).observe(gpu.canvas)
    }

    callback() {
        Engine.params.elapsed = performance.now() - Engine.then
        LoopController.loop(this.entities)
        Engine.frameID = requestAnimationFrame(() => this.callback())
    }

    start() {
        if (!Engine.frameID)
            Engine.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
