import CameraAPI from "./apis/CameraAPI"
import ENVIRONMENT from "../static/ENVIRONMENT"
import LoopAPI from "./apis/rendering/LoopAPI";
import DeferredPass from "./passes/rendering/DeferredPass";
import SSGIPass from "./passes/rendering/SSGIPass";
import SSRPass from "./passes/rendering/SSRPass";
import AOPass from "./passes/rendering/AOPass";
import {ConversionAPI} from "../production";
import ShadowMapPass from "./passes/rendering/ShadowMapPass";

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
        if (Engine.#initialized)
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

    static updateParams(data) {
        Engine.params = data

        SSGIPass.settingsBuffer[0] = data.SSGI.stepSize
        SSGIPass.settingsBuffer[1] = data.SSGI.strength

        SSGIPass.rayMarchSettings[0] = data.SSGI.maxSteps
        SSGIPass.rayMarchSettings[1] = data.SSGI.binarySearchSteps
        SSGIPass.rayMarchSettings[2] = data.SSGI.depthThreshold

        SSGIPass.enabled = data.SSGI.enabled
        DeferredPass.deferredUniforms.screenSpaceGI = data.SSGI.enabled ? SSGIPass.sampler : undefined

        SSRPass.uniforms.stepSize = data.SSR.stepSize
        SSRPass.rayMarchSettings[0] = data.SSR.maxSteps
        SSRPass.rayMarchSettings[1] = data.SSR.binarySearchSteps
        SSRPass.rayMarchSettings[2] = data.SSR.depthThreshold

        SSRPass.enabled = data.SSR.enabled
        DeferredPass.deferredUniforms.screenSpaceReflections = data.SSR.enabled ? SSRPass.sampler : undefined


        AOPass.settings[0] = data.SSAO.radius
        AOPass.settings[1] = data.SSAO.power

        AOPass.enabled = data.SSAO.enabled
        DeferredPass.deferredUniforms.aoSampler = data.SSAO.enabled ? AOPass.filteredSampler : undefined
        const settingsBuffer = DeferredPass.deferredUniforms.settings
        settingsBuffer[6] = data.pcfSamples
        settingsBuffer[5] = data.SSAO.enabled ? 1 : 0
        settingsBuffer[1] = ShadowMapPass.maxResolution
        settingsBuffer[3] = ShadowMapPass.atlasRatio

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
