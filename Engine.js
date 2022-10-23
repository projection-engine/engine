import CameraAPI from "./lib/apis/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import DeferredPass from "./lib/passes/DeferredPass";
import SSGIPass from "./lib/passes/SSGIPass";
import SSRPass from "./lib/passes/SSRPass";
import AOPass from "./lib/passes/AOPass";
import DirectionalShadows from "./lib/passes/DirectionalShadows";
import ConversionAPI from "./lib/apis/math/ConversionAPI";

const METRICS = {
    frameRate: 0,
    frameTime: 0,
    rendering: 0,
    scripting: 0,
    simulation: 0,
    singleLoop: 0
}
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
        sprites: [],
        terrain: []
    }
    static params = {}
    static then = 0
    static elapsed = 0
    static frameID
    static isReady = false
    static readAsset
    static metrics = METRICS

    static #initialized = false

    static async initialize() {
        if (Engine.#initialized)
            return
        Engine.#initialized = true
        await Loop.initialize()
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
        DeferredPass.deferredUniforms.hasAO = data.SSAO.enabled ? 1 : 0
        const settingsBuffer = DeferredPass.deferredUniforms.settings
        settingsBuffer[1] = DirectionalShadows.maxResolution
        settingsBuffer[2] = DirectionalShadows.atlasRatio
    }

    static #callback() {
        const now = performance.now()
        const el = now - Engine.then
        Engine.elapsed = el
        Engine.then = now

        METRICS.frameRate = 1000 / el
        METRICS.frameTime = el

        Loop.loop(Engine.entities)

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
