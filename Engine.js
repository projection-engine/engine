import CameraAPI from "./lib/utils/CameraAPI"
import ENVIRONMENT from "./static/ENVIRONMENT"
import Loop from "./Loop";
import GlobalIlluminationPass from "./runtime/rendering/GlobalIlluminationPass";
import AmbientOcclusion from "./runtime/occlusion/AmbientOcclusion";
import DirectionalShadows from "./runtime/occlusion/DirectionalShadows";
import ConversionAPI from "./lib/math/ConversionAPI";
import PhysicsPass from "./runtime/misc/PhysicsPass";
import MotionBlur from "./runtime/post-processing/MotionBlur";
import FrameComposition from "./runtime/post-processing/FrameComposition";
import GPU from "./GPU";
import STATIC_FRAMEBUFFERS from "./static/resources/STATIC_FRAMEBUFFERS";
import LensPostProcessing from "./runtime/post-processing/LensPostProcessing";
import OmnidirectionalShadows from "./runtime/occlusion/OmnidirectionalShadows";
import SpritePass from "./runtime/rendering/SpritePass";
import PhysicsAPI from "./lib/rendering/PhysicsAPI";
import FileSystemAPI from "./lib/utils/FileSystemAPI";
import ScriptsAPI from "./lib/rendering/ScriptsAPI";
import UIAPI from "./lib/rendering/UIAPI";
import VisibilityBuffer from "./runtime/rendering/VisibilityBuffer";
import LightProbe from "./instances/LightProbe";
import COMPONENTS from "./static/COMPONENTS";
import {mat4, vec3} from "gl-matrix";
import CUBE_MAP_VIEWS from "./static/CUBE_MAP_VIEWS";
import SceneRenderer from "./runtime/rendering/SceneRenderer";

export default class Engine {
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

    static #activeSkylightEntity
    static set activeSkylightEntity(entity) {
        Engine.#activeSkylightEntity = entity
        Engine.updateSkylight()
    }

    static get activeSkylightEntity() {
        return Engine.#activeSkylightEntity
    }

    static skylightProbe

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

    static async initialize(canvas, mainResolution, readAsset, readMetadata) {
        if (Engine.#initialized)
            return
        Engine.#initialized = true
        await GPU.initializeContext(canvas, mainResolution)
        FileSystemAPI.initialize(readAsset, readMetadata)

        Engine.currentFrameFBO = GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.CURRENT_FRAME)
        Engine.previousFrameSampler = Engine.currentFrameFBO.colors[0]
        // Bokeh.initialize()
        VisibilityBuffer.initialize()
        LensPostProcessing.initialize()
        FrameComposition.initialize()
        await AmbientOcclusion.initialize()
        GlobalIlluminationPass.initialize()
        OmnidirectionalShadows.initialize()
        DirectionalShadows.initialize()
        SpritePass.initialize()

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
        Engine.skylightProbe = new LightProbe()
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

    static updateSkylight() {
        const entity = Engine.#activeSkylightEntity
        if (entity) {
            const skylight = entity.components.get(COMPONENTS.SKYLIGHT)
            Engine.skylightProbe.resolution = skylight.resolution
            Engine.skylightProbe.draw((yaw, pitch, projection, index) => {
                const position = vec3.add([], Engine.skylightProbe.translation, CUBE_MAP_VIEWS.target[index])
                const view = mat4.lookAt([], Engine.skylightProbe.translation, position, CUBE_MAP_VIEWS.up[index])
                const viewProjection = mat4.multiply([], projection, view)
                SceneRenderer.draw(true, viewProjection, position)
            })
        }
    }

    static updateParams(data, physicsSteps, physicsSubSteps) {
        Engine.params = data

        if (typeof physicsSteps === "number")
            PhysicsPass.subSteps = physicsSubSteps
        if (typeof physicsSteps === "number")
            PhysicsPass.simulationStep = physicsSteps

        GlobalIlluminationPass.blurSamples = data.SSGI.blurSamples || 3
        GlobalIlluminationPass.ssgiColorGrading[0] = data.SSGI.gamma || 2.2
        GlobalIlluminationPass.ssgiColorGrading[1] = data.SSGI.exposure || 1

        GlobalIlluminationPass.rayMarchSettings[0] = data.SSR.falloff || 3
        GlobalIlluminationPass.rayMarchSettings[1] = data.SSR.minRayStep || .1
        GlobalIlluminationPass.rayMarchSettings[2] = data.SSR.stepSize || 1

        GlobalIlluminationPass.rayMarchSettings[3] = data.SSGI.stepSize || 1
        GlobalIlluminationPass.rayMarchSettings[4] = data.SSGI.strength || 1

        GlobalIlluminationPass.rayMarchSettings[5] = data.SSGI.enabled ? 1 : 0
        GlobalIlluminationPass.rayMarchSettings[6] = data.SSR.enabled ? 1 : 0

        GlobalIlluminationPass.SSREnabled = data.SSR.enabled
        GlobalIlluminationPass.SSGIEnabled = data.SSGI.enabled

        GlobalIlluminationPass.rayMarchSettings[7] = data.SSGI.maxSteps || 4
        GlobalIlluminationPass.rayMarchSettings[8] = data.SSR.maxSteps || 4

        AmbientOcclusion.settings = [data.SSAO.radius, data.SSAO.power, data.SSAO.bias]
        AmbientOcclusion.blurSamples = data.SSAO.blurSamples || 2
        AmbientOcclusion.maxSamples = data.SSAO.maxSamples || 64
        AmbientOcclusion.enabled = data.SSAO.enabled

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
