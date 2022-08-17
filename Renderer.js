import CameraInstance from "./libs/instances/CameraInstance"
import ENVIRONMENT from "./data/ENVIRONMENT"
import EngineLoop from "./libs/loop/EngineLoop";

export default class Renderer {

    static entitiesMap = new Map()

    static meshes = new Map()
    entities = []
    materials = []

    static environment = ENVIRONMENT.DEV
    static rootCamera = new CameraInstance()

    static data = {}
    static params = {}

    static queryMap = new Map()
    static then = 0
    static cubeBuffer
    static BRDF
    static frameID
    static fallbackMaterial


    constructor(resolution) {
        EngineLoop.initialize(resolution)

        // CAMERA ASPECT RATIO OBSERVER
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            if (Renderer.params.camera) {
                Renderer.params.camera.aspectRatio = bBox.width / bBox.height
                Renderer.params.camera.updateProjection()
            }
        }).observe(gpu.canvas)
    }

    callback() {
        Renderer.params.elapsed = performance.now() - Renderer.then
        EngineLoop.loop(this.entities)
        Renderer.frameID = requestAnimationFrame(() => this.callback())
    }

    start() {
        if (!Renderer.frameID)
            Renderer.frameID = requestAnimationFrame(() => this.callback())
    }

    stop() {
        cancelAnimationFrame(Renderer.frameID)
        Renderer.frameID = undefined
    }
}
