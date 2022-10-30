import CameraAPI from "./api/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import GBuffer from "./runtime/renderers/GBuffer";
import GlobalIlluminationPass from "./runtime/GlobalIlluminationPass";
import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import ConversionAPI from "./api/math/ConversionAPI";
import ScriptingPass from "./runtime/ScriptingPass";
import PhysicsPass from "./runtime/PhysicsPass";

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
    static isDev = false
    static entities = []
    static #environment = ENVIRONMENT.DEV

    static get environment() {
        return Engine.#environment
    }

    static set environment(data) {
        ScriptingPass.entitiesToExecute = data !== ENVIRONMENT.DEV ? Engine.entities : []
        Engine.isDev = data === ENVIRONMENT.DEV
        Engine.#environment = data
        if (Engine.isDev)
            CameraAPI.updateAspectRatio()
    }

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

    static updateParams(data, physicsSteps, physicsSubSteps) {
        Engine.params = data

        if (typeof physicsSteps === "number")
            PhysicsPass.subSteps = physicsSubSteps
        if (typeof physicsSteps === "number")
            PhysicsPass.simulationStep = physicsSteps

        GlobalIlluminationPass.rayMarchSettings[0] = data.SSR.falloff || 3
        GlobalIlluminationPass.rayMarchSettings[1] = data.SSR.minRayStep || .1
        GlobalIlluminationPass.rayMarchSettings[2] = data.SSR.stepSize || 1

        GlobalIlluminationPass.rayMarchSettings[3] = data.SSGI.stepSize || 1
        GlobalIlluminationPass.rayMarchSettings[4] = data.SSGI.strength || 1

        GlobalIlluminationPass.rayMarchSettings[5] = data.SSGI.enabled ? 1 : 0
        GlobalIlluminationPass.rayMarchSettings[6] = data.SSR.enabled ? 1 : 0

        GlobalIlluminationPass.rayMarchSettings[7] = data.SSGI.maxSteps || 4
        GlobalIlluminationPass.rayMarchSettings[8] = data.SSR.maxSteps || 4

        AmbientOcclusion.settings[0] = data.SSAO.radius
        AmbientOcclusion.settings[1] = data.SSAO.power
        AmbientOcclusion.settings[2] = data.SSAO.bias

        AmbientOcclusion.enabled = data.SSAO.enabled
        GBuffer.deferredUniforms.aoSampler = data.SSAO.enabled ? AmbientOcclusion.filteredSampler : undefined
        GBuffer.deferredUniforms.hasAO = data.SSAO.enabled ? 1 : 0
        const settingsBuffer = GBuffer.deferredUniforms.settings
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
