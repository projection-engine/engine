import CameraAPI from "./api/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import GBuffer from "./runtime/renderers/GBuffer";
import GlobalIlluminationPass from "./runtime/GlobalIlluminationPass";
import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import ConversionAPI from "./api/math/ConversionAPI";
import PhysicsPass from "./runtime/PhysicsPass";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import ScreenEffectsPass from "./runtime/post-processing/ScreenEffectsPass";
import DiffuseProbePass from "./runtime/renderers/DiffuseProbePass";
import OmnidirectionalShadows from "./runtime/occlusion/OmnidirectionalShadows";
import SpritePass from "./runtime/renderers/SpritePass";
import PhysicsAPI from "./api/PhysicsAPI";
import FileSystemAPI from "./api/FileSystemAPI";
import ScriptsAPI from "./api/ScriptsAPI";
import UIAPI from "./api/UIAPI";

const METRICS = {
    frameRate: 0,
    frameTime: 0,
    rendering: 0,
    scripting: 0,
    simulation: 0,
    singleLoop: 0
}
export default class Engine {
    static previousFrame


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
        specularProbes: [],
        cameras: [],
        diffuseProbes: [],
        sprites: [],
        terrain: []
    }

    static params = {}
    static elapsed = 0
    static frameID
    static isReady = false
    static metrics = METRICS

    static #initialized = false

    static async initialize(canvas, width, height, readAsset, readMetadata) {
        if (Engine.#initialized)
            return

        await GPU.initializeContext(canvas, width, height)
        FileSystemAPI.initialize(readAsset, readMetadata)
        Engine.#initialized = true
        Engine.previousFrame = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        ScreenEffectsPass.initialize()
        FrameComposition.initialize()
        AmbientOcclusion.initialize()
        GlobalIlluminationPass.initialize()
        DiffuseProbePass.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
        SpritePass.initialize()
        GBuffer.initialize()
        MotionBlur.initialize()
        await PhysicsAPI.initialize()

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

        GlobalIlluminationPass.rayMarchSettings[0] = data.SSR.falloff || 3
        GlobalIlluminationPass.rayMarchSettings[1] = data.SSR.minRayStep || .1
        GlobalIlluminationPass.rayMarchSettings[2] = data.SSR.stepSize || 1

        GlobalIlluminationPass.rayMarchSettings[3] = data.SSGI.stepSize || 1
        GlobalIlluminationPass.rayMarchSettings[4] = data.SSGI.strength || 1

        GlobalIlluminationPass.rayMarchSettings[5] = data.SSGI.enabled ? 1 : 0
        GlobalIlluminationPass.rayMarchSettings[6] = data.SSR.enabled ? 1 : 0

        GlobalIlluminationPass.rayMarchSettings[7] = data.SSGI.maxSteps || 4
        GlobalIlluminationPass.rayMarchSettings[8] = data.SSR.maxSteps || 4

        AmbientOcclusion.settings = [data.SSAO.radius, data.SSAO.power, data.SSAO.bias]

        AmbientOcclusion.enabled = data.SSAO.enabled
        GBuffer.deferredUniforms.aoSampler = data.SSAO.enabled ? AmbientOcclusion.filteredSampler : undefined

        GBuffer.UBO.bind()
        GBuffer.UBO.updateData("shadowMapsQuantity", new Float32Array([DirectionalShadows.maxResolution]))
        GBuffer.UBO.updateData("shadowMapResolution", new Float32Array([DirectionalShadows.atlasRatio]))
        GBuffer.UBO.updateData("hasAO", new Uint8Array([data.SSAO.enabled ? 1 : 0]))
        GBuffer.UBO.unbind()
        MotionBlur.uniforms.velocityScale = data.mbVelocityScale
        MotionBlur.uniforms.maxSamples = data.mbSamples
    }


    static start() {
        if (!Engine.frameID && Engine.isReady)
            Engine.frameID = requestAnimationFrame(() => Loop.loop())
    }

    static stop() {
        cancelAnimationFrame(Engine.frameID)
        Engine.frameID = undefined
    }
}
