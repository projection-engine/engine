import CameraAPI from "./lib/utils/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import SSGI from "./runtime/SSGI";
import SSAO from "./runtime/SSAO";
import DirectionalShadows from "./runtime/DirectionalShadows";
import ConversionAPI from "./lib/math/ConversionAPI";
import PhysicsPass from "./runtime/PhysicsPass";
import MotionBlur from "./runtime/MotionBlur";
import FrameComposition from "./runtime/FrameComposition";
import GPU from "./GPU";
import LensPostProcessing from "./runtime/LensPostProcessing";
import OmnidirectionalShadows from "./runtime/OmnidirectionalShadows";
import PhysicsAPI from "./lib/rendering/PhysicsAPI";
import FileSystemAPI from "./lib/utils/FileSystemAPI";
import ScriptsAPI from "./lib/utils/ScriptsAPI";
import UIAPI from "./lib/rendering/UIAPI";
import VisibilityRenderer from "./runtime/VisibilityRenderer";
import LightProbe from "./instances/LightProbe";
import SceneRenderer from "./runtime/SceneRenderer";

import Entity from "./instances/Entity";
import UberShader from "./utils/UberShader";

const boolBuffer = new Uint8Array(1)
const singleFloatBuffer = new Float32Array(1)


export default class Engine  {
    static #development = false

    static get developmentMode() {
        return Engine.#development
    }

    static entitiesMap = new Map<string, Entity>()
    static queryMap = new Map<string, Entity>()
    static UILayouts = new Map()
    static isDev = true
    static entities: Entity[] = []
    static #environment: number = ENVIRONMENT.DEV

    static get environment(): number {
        return Engine.#environment
    }

    static set environment(data: number) {
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
    static #initialized = false;

    static async initializeContext(canvas: HTMLCanvasElement, mainResolution: { w: number, h: number } | undefined, readAsset: Function, readMetadata: Function, devAmbient: boolean) {
        if (Engine.#initialized)
            return
        Engine.#initialized = true

        Engine.#development = devAmbient
        await GPU.initializeContext(canvas, mainResolution)
        FileSystemAPI.initialize(readAsset, readMetadata)

        LensPostProcessing.initialize()
        FrameComposition.initialize()
        await SSAO.initialize()
        SSGI.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()


        await PhysicsAPI.initialize()

        ConversionAPI.canvasBBox = GPU.canvas.getBoundingClientRect()
        const OBS = new ResizeObserver(() => {
            const bBox = GPU.canvas.getBoundingClientRect()
            ConversionAPI.canvasBBox = bBox
            CameraAPI.aspectRatio = bBox.width / bBox.height
            CameraAPI.updateProjection()
        })
        OBS.observe(GPU.canvas.parentElement)
        OBS.observe(GPU.canvas)
        Engine.isReady = true

        GPU.skylightProbe = new LightProbe(128)
        Engine.start()

    }

    static async startSimulation() {
        Engine.environment = ENVIRONMENT.EXECUTION
        UIAPI.buildUI(GPU.canvas.parentElement)
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

        const sceneUBO = UberShader.UBO


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
        boolBuffer[0] = data.AAMethod || 0
        FrameComposition.AAMethodInUse = boolBuffer[0]
        FrameComposition.UBO.updateData("AAMethod", boolBuffer)
        FrameComposition.UBO.updateData("FXAASpanMax", new Float32Array([data.FXAASpanMax || 8]))
        FrameComposition.UBO.updateData("FXAAReduceMin", new Float32Array([data.FXAAReduceMin || 1.0 / 128.0]))
        FrameComposition.UBO.updateData("FXAAReduceMul", new Float32Array([data.FXAAReduceMul || 1.0 / 8.0]))

        FrameComposition.UBO.unbind()
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
