import CameraInstance from "./libs/instances/CameraInstance"
import ENVIRONMENT from "./data/ENVIRONMENT"
import EngineLoop from "./libs/loop/EngineLoop";

let gpu
export default class Renderer {

    static entitiesMap = new Map()
    meshes = new Map()
    activeEntitiesSize = 0 // DEV
    entities = []
    materials = []

    environment = ENVIRONMENT.PROD
    rootCamera = new CameraInstance()

    data = {}
    params = {}

    static queryMap = new Map()
    static then = 0
    static cubeBuffer
    static BRDF
    static frameID
    static fallbackMaterial


    constructor(resolution) {
        gpu = window.gpu
        EngineLoop.initialize(resolution)

        // CAMERA ASPECT RATIO OBSERVER
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            if (this.params.camera) {
                this.params.camera.aspectRatio = bBox.width / bBox.height
                this.params.camera.updateProjection()
            }
        }).observe(gpu.canvas)
    }

    callback() {
        this.params.elapsed = performance.now() - Renderer.then

        EngineLoop.loop(
            this.params,
            this.data,
            this.entities,
            this.params.onWrap
        )

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
