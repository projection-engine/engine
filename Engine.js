import CameraAPI from "./lib/utils/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import SSGI from "./runtime/rendering/SSGI";
import SSAO from "./runtime/rendering/SSAO";
import DirectionalShadows from "./runtime/rendering/DirectionalShadows";
import ConversionAPI from "./lib/math/ConversionAPI";
import PhysicsPass from "./runtime/misc/PhysicsPass";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import LensPostProcessing from "./runtime/post-processing/LensPostProcessing";
import OmnidirectionalShadows from "./runtime/rendering/OmnidirectionalShadows";
import SpritePass from "./runtime/rendering/SpritePass";
import PhysicsAPI from "./lib/rendering/PhysicsAPI";
import FileSystemAPI from "./lib/utils/FileSystemAPI";
import ScriptsAPI from "./lib/rendering/ScriptsAPI";
import UIAPI from "./lib/rendering/UIAPI";
import VisibilityBuffer from "./runtime/rendering/VisibilityBuffer";
import LightProbe from "./instances/LightProbe";

import SceneRenderer from "./runtime/rendering/SceneRenderer";

export default class Engine {
    static #development = false

    static get developmentMode() {
        return Engine.#development
    }

    static currentFrameFBO
    static previousFrameSampler

    static entitiesMap = new Map()
    static dataEntity = new Map()
    static queryMap = new Map()
    static UILayouts = new Map()
    static isDev = true
    static entities = []
    static #environment = ENVIRONMENT.DEV

    static get environment() {
        return Engine.#environment
    }

    static set environment(data) {
        Engine.isDev = data === ENVIRONMENT.DEV
        Engine.#environment = data
        if (Engine.isDev)
            CameraAPI.updateAspectRatio()
    }


    static data = {
        pointLights: [],
        meshes: [],
        directionalLights: [],

        cameras: [],

        sprites: [],
        terrain: [],
        skylights: []
    }

    static params = {}
    static elapsed = 0
    static frameID
    static isReady = false
    static benchmarkMode = false
    static #initialized = false

    static async initialize(canvas, mainResolution, readAsset, readMetadata, devAmbient) {
        if (Engine.#initialized)
            return


        Engine.#development = devAmbient
        Engine.#initialized = true
        await GPU.initializeContext(canvas, mainResolution)
        FileSystemAPI.initialize(readAsset, readMetadata)

        Engine.currentFrameFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        Engine.previousFrameSampler = Engine.currentFrameFBO.colors[0]
        // Bokeh.initialize()
        VisibilityBuffer.initialize()
        LensPostProcessing.initialize()
        FrameComposition.initialize()
        await SSAO.initialize()
        SSGI.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
        SpritePass.initialize()

        MotionBlur.initialize()
        await PhysicsAPI.initialize()
        SceneRenderer.initialize()

        ConversionAPI.canvasBBox = gpu.canvas.getBoundingClientRect()
        const OBS = new ResizeObserver(() => {
            const bBox = gpu.canvas.getBoundingClientRect()
            ConversionAPI.canvasBBox = bBox
            CameraAPI.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        })
        OBS.observe(gpu.canvas.parentElement)
        OBS.observe(gpu.canvas)
        Engine.isReady = true
        Loop.linkParams()
        GPU.skylightProbe = new LightProbe(128)
        Engine.start()

    }

    static async startSimulation() {
        Engine.environment = ENVIRONMENT.EXECUTION
        UIAPI.buildUI(gpu.canvas.parentElement)
        const entities = Engine.entities
        for (let i = 0; i < entities.length; i++) {
            const current = entities[i]
            PhysicsAPI.registerRigidBody(current)
        }
        await ScriptsAPI.updateAllScripts()
    }


    static updateParams(data, physicsSteps, physicsSubSteps) {
        Engine.params = data

        if (typeof physicsSteps === "number")
            PhysicsPass.subSteps = physicsSubSteps
        if (typeof physicsSteps === "number")
            PhysicsPass.simulationStep = physicsSteps

        SSGI.blurSamples = data.SSGI.blurSamples || 3
        SSGI.ssgiColorGrading[0] = data.SSGI.gamma || 2.2
        SSGI.ssgiColorGrading[1] = data.SSGI.exposure || 1

        SSGI.rayMarchSettings[0] = data.SSGI.stepSize || 1
        SSGI.rayMarchSettings[1] = data.SSGI.maxSteps || 4
        SSGI.rayMarchSettings[2] = data.SSGI.strength || 1


        SceneRenderer.rayMarchSettings[0] = data.SSR.maxSteps || 4
        SceneRenderer.rayMarchSettings[1] = data.SSR.falloff || 3
        SceneRenderer.rayMarchSettings[2] = data.SSR.minRayStep || .1
        SceneRenderer.rayMarchSettings[3] = data.SSR.stepSize || 1


        SSGI.enabled = data.SSGI.enabled

        SSAO.settings = [data.SSAO.radius || .25, data.SSAO.power || 1, data.SSAO.bias || .1, data.SSAO.falloffDistance || 1000]
        SSAO.blurSamples = data.SSAO.blurSamples || 2
        SSAO.maxSamples = data.SSAO.maxSamples || 64
        SSAO.enabled = data.SSAO.enabled

        MotionBlur.velocityScale = data.mbVelocityScale
        MotionBlur.maxSamples = data.mbSamples

        FrameComposition.UBO.bind()
        FrameComposition.UBO.updateData("fxaaEnabled", new Uint8Array([data.fxaa ? 1 : 0]))
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([data.FXAASpanMax || 8]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([data.FXAAReduceMin || 1.0 / 128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([data.FXAAReduceMul || 1.0 / 8.0]))

        FrameComposition.UBO.unbind()
        Loop.linkParams()
    }


    static start() {
        if (!Engine.frameID && Engine.isReady)
            Engine.frameID = requestAnimationFrame(Loop.loop)
    }

    static stop() {
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
