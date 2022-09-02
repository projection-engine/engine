import CameraAPI from "../libs/CameraAPI"
import ENVIRONMENT from "../data/ENVIRONMENT"
import LoopController from "./LoopController";

export default class RendererController {

    static entitiesMap = new Map()

    entities = []
    materials = []

    static environment = ENVIRONMENT.DEV

    static data = {}
    static params = {}
    static queryMap = new Map()
    static then = 0
    static frameID
    static fallbackMaterial

    constructor() {
        LoopController.initialize()

        // CAMERA ASPECT RATIO OBSERVER
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            CameraAPI.metadata.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        }).observe(gpu.canvas)
    }

    callback() {
        RendererController.params.elapsed = performance.now() - RendererController.then
        LoopController.loop(this.entities)
        RendererController.frameID = requestAnimationFrame(() => this.callback())
    }

    start() {
        if (!RendererController.frameID)
            RendererController.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(RendererController.frameID)
        RendererController.frameID = undefined
    }
}
