import System from "../basic/System";
import PostProcessingShader from "../../shaders/classes/misc/PostProcessingShader";
import PostProcessingFramebuffer from "../../elements/buffer/mics/PostProcessingFramebuffer";
import {bindTexture, copyTexture} from "../../utils/misc/utils";
import ScreenSpaceBuffer from "../../elements/buffer/mics/ScreenSpaceBuffer";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SelectedSystem from "./subsystems/SelectedSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";
import Quad from "../../utils/workers/Quad";
import ShadowMapDebugShader from "../../shaders/classes/shadows/ShadowMapDebugShader";
import GlobalIlluminationSystem from "./subsystems/gi/GlobalIlluminationSystem";
import SYSTEMS from "../../utils/misc/SYSTEMS";

export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu

        this.screenSpace = new ScreenSpaceBuffer(gpu, resolutionMultiplier)
        this.postProcessing = new PostProcessingFramebuffer(gpu, resolutionMultiplier)

        this.shadowMapDebugShader = new ShadowMapDebugShader(gpu)
        this.quad = new Quad(gpu)

        this.shader = new PostProcessingShader(gpu)
        this.noFxaaShader = new PostProcessingShader(gpu, true)


        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.selectedSystem = new SelectedSystem(gpu)
    }

    execute(options, systems, data) {
        super.execute()
        const {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,
            skylight
        } = data
        const {
            selected,
            camera,
            fxaa,
            iconsVisibility,
            gridVisibility,
            shadingModel,
            noRSM,
        } = options
        const meshSystem = systems[SYSTEMS.MESH]

        // SSR
        // copyTexture(this.screenSpace.frameBufferObject, this.postProcessing.frameBufferObject, this.gpu, this.gpu.COLOR_BUFFER_BIT)

        const shadowsSystem = systems[SYSTEMS.SHADOWS]
        if (!noRSM && shadowsSystem.needsGIUpdate && skylight)
            this.GISystem.execute(systems, skylight)

        this.postProcessing.startMapping()
        this.skyboxSystem.execute(skybox, camera)
        this.gridSystem.execute(gridVisibility, camera)
        this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility)

        let giFBO, giGridSize
        if (!noRSM && skylight) {
            giGridSize = this.GISystem.size
            giFBO = this.GISystem.accumulatedBuffer
        }

        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems, giFBO, giGridSize, skylight)


        copyTexture(this.postProcessing.frameBufferObject, meshSystem.gBuffer.gBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)

        this.gpu.enable(this.gpu.BLEND)
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA)
        this.gpu.disable(this.gpu.DEPTH_TEST)
        this.selectedSystem.execute(meshes, meshSources, selected, camera)
        this.postProcessing.stopMapping()

        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()
        this.postProcessing.draw(shaderToApply)

        // this.shadowMapDebugShader.use()
        //
        // bindTexture(
        //     0,
        //     shadowsSystem.rsmFramebuffer.rsmFluxTexture,
        //     this.shadowMapDebugShader.shadowMapULocation,
        //     this.gpu)
        //
        //
        // this.quad.draw(this.shadowMapDebugShader.positionLocation)

    }
}