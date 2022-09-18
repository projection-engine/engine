import CameraAPI from "./apis/camera/CameraAPI"
import ENVIRONMENT from "../static/ENVIRONMENT"
import LoopAPI from "./apis/rendering/LoopAPI";

export default class Engine {
    static entitiesMap = new Map()
    static dataEntity = new Map()
    static queryMap = new Map()
    static UILayouts = new Map()

    static entities = []
    static environment = ENVIRONMENT.DEV
    static data = {
        pointLights: [],
        meshes: [],
        directionalLights: [],
        specularProbes: [],
        cameras: [],
        diffuseProbes: [],
        sprites: []
    }
    static params = {}
    static then = 0
    static frameID
    static isReady = false
    static readAsset


    static initialize() {
        LoopAPI.initialize()
            .then(() => {
                new ResizeObserver(() => {
                    const bBox = gpu.canvas.getBoundingClientRect()
                    CameraAPI.aspectRatio = bBox.width / bBox.height
                    CameraAPI.updateProjection()
                }).observe(gpu.canvas)
                Engine.isReady = true
                Engine.start()
            })
    }

    static #callback() {
        Engine.then = performance.now()
        LoopAPI.loop(Engine.entities)
        Engine.elapsed = performance.now() - Engine.then
        Engine.frameID = requestAnimationFrame(() => Engine.#callback())

    }

    static start() {
        if (!Engine.frameID && Engine.isReady)
            Engine.frameID = requestAnimationFrame(() => Engine.#callback())
    }

    static stop() {
        console.trace("STOPPING")
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
