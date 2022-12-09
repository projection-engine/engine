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
import SpriteRenderer from "./runtime/rendering/SpriteRenderer";
import PhysicsAPI from "./lib/rendering/PhysicsAPI";
import FileSystemAPI from "./lib/utils/FileSystemAPI";
import ScriptsAPI from "./lib/rendering/ScriptsAPI";
import UIAPI from "./lib/rendering/UIAPI";
import VisibilityRenderer from "./runtime/rendering/VisibilityRenderer";
import LightProbe from "./instances/LightProbe";

import SceneRenderer from "./runtime/rendering/SceneRenderer";

const boolBuffer = new Uint8Array(1)
const singleFloatBuffer = new Float32Array(1)
export default class Engine {
    static #development = false

    static get developmentMode() {
        return Engine.#development
    }

    static currentFrameFBO
    static previousFrameSampler

    static entitiesMap = new Map()
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
        VisibilityRenderer.initialize()
        LensPostProcessing.initialize()
        FrameComposition.initialize()
        await SSAO.initialize()
        SSGI.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
        SpriteRenderer.initialize()

        MotionBlur.initialize()
        await PhysicsAPI.initialize()

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


    static updateParams(data, SSGISettings, SSRSettings, SSSSettings, SSAOSettings, physicsSteps, physicsSubSteps) {
        Engine.params = data

        if (typeof physicsSteps === "number")
            PhysicsPass.subSteps = physicsSubSteps
        if (typeof physicsSteps === "number")
            PhysicsPass.simulationStep = physicsSteps

        SSGI.blurSamples = SSGISettings.blurSamples || 3
        SSGI.ssgiColorGrading[0] = SSGISettings.gamma || 2.2
        SSGI.ssgiColorGrading[1] = SSGISettings.exposure || 1

        SSGI.rayMarchSettings[0] = SSGISettings.stepSize || 1
        SSGI.rayMarchSettings[1] = SSGISettings.maxSteps || 4
        SSGI.rayMarchSettings[2] = SSGISettings.strength || 1

        const sceneUBO = SceneRenderer.UBO

        sceneUBO.bind()
        singleFloatBuffer[0] = SSRSettings.falloff || 3
        sceneUBO.updateData("SSRFalloff", singleFloatBuffer)
        singleFloatBuffer[0] = SSRSettings.stepSize || 1
        sceneUBO.updateData("stepSizeSSR", singleFloatBuffer)
        singleFloatBuffer[0] = SSSSettings.maxDistance || .05
        sceneUBO.updateData("maxSSSDistance", singleFloatBuffer)
        singleFloatBuffer[0] = SSSSettings.depthThickness || .05
        sceneUBO.updateData("SSSDepthThickness", singleFloatBuffer)
        singleFloatBuffer[0] = SSSSettings.edgeFalloff || 12
        sceneUBO.updateData("SSSEdgeAttenuation", singleFloatBuffer)
        singleFloatBuffer[0] = SSSSettings.depthDelta || 0
        sceneUBO.updateData("SSSDepthDelta", singleFloatBuffer)
        boolBuffer[0] = SSRSettings.maxSteps || 4
        sceneUBO.updateData("maxStepsSSR", boolBuffer)
        boolBuffer[0] = SSSSettings.maxSteps || 24
        sceneUBO.updateData("maxStepsSSS", boolBuffer)
        boolBuffer[0] = SSAOSettings.enabled ? 1 : 0
        sceneUBO.updateData("hasAmbientOcclusion", boolBuffer)
        singleFloatBuffer[0] = SSAOSettings.falloffDistance || 1000
        sceneUBO.updateData("SSAOFalloff", singleFloatBuffer)

        sceneUBO.unbind()

        SSGI.enabled = SSGISettings.enabled

        SSAO.settings = [SSAOSettings.radius || .25, SSAOSettings.power || 1, SSAOSettings.bias || .1, SSAOSettings.falloffDistance || 1000]
        SSAO.blurSamples = SSAOSettings.blurSamples || 2
        SSAO.maxSamples = SSAOSettings.maxSamples || 64
        SSAO.enabled = SSAOSettings.enabled

        MotionBlur.velocityScale = data.mbVelocityScale
        MotionBlur.maxSamples = data.mbSamples

        FrameComposition.UBO.bind()
        boolBuffer[0] = data.fxaa ? 1 : 0
        FrameComposition.UBO.updateData("fxaaEnabled", boolBuffer)
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([data.FXAASpanMax || 8]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([data.FXAAReduceMin || 1.0 / 128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([data.FXAAReduceMul || 1.0 / 8.0]))

        FrameComposition.UBO.unbind()
        Loop.linkParams()
        VisibilityRenderer.needsUpdate = true
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
