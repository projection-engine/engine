import CameraAPI from "./apis/camera/CameraAPI"
import ENVIRONMENT from "../static/ENVIRONMENT"
import LoopAPI from "./apis/rendering/LoopAPI";
import DeferredPass from "./passes/rendering/DeferredPass";
import SSGIPass from "./passes/rendering/SSGIPass";
import SSRPass from "./passes/rendering/SSRPass";
import AOPass from "./passes/rendering/AOPass";
import {ConversionAPI} from "../production";

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

    static #initialized = false

    static async initialize() {
        if(Engine.#initialized)
            return
        Engine.#initialized = true
        await LoopAPI.initialize()
        ConversionAPI.canvasBBox = gpu.canvas.getBoundingClientRect()
        new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            ConversionAPI.canvasBBox = bBox
            CameraAPI.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        }).observe(gpu.canvas)
        Engine.isReady = true
        Engine.start()

    }

    static updateParams(data){
        Engine.params = data
        if(data.ssgi)
            DeferredPass.deferredUniforms.screenSpaceGI = SSGIPass.sampler
        else
            DeferredPass.deferredUniforms.screenSpaceGI = undefined

        if(data.ssr)
            DeferredPass.deferredUniforms.screenSpaceReflections = SSRPass.sampler
        else
            DeferredPass.deferredUniforms.screenSpaceReflections = undefined

        if(data.ao)
            DeferredPass.deferredUniforms.aoSampler = AOPass.filteredSampler
        else
            DeferredPass.deferredUniforms.aoSampler = undefined

        SSGIPass.settingsBuffer[0] = data.ssgiStepSize
        SSGIPass.settingsBuffer[1] = data.ssgiNoiseScale + 100
        SSGIPass.settingsBuffer[2] = data.ssgiBrightness

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
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
