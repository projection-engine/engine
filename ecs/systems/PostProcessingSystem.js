import System from "../basic/System";
import PostProcessingShader from "../../shaders/classes/PostProcessingShader";
import PostProcessingFramebuffer from "../../elements/buffer/PostProcessingFramebuffer";
import MeshSystem from "./MeshSystem";
import {copyTexture} from "../../utils/misc/utils";
import ScreenSpaceBuffer from "../../elements/buffer/ScreenSpaceBuffer";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SelectedSystem from "./subsystems/SelectedSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";

export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu

        this.screenSpace = new ScreenSpaceBuffer(gpu, resolutionMultiplier)
        this.postProcessing = new PostProcessingFramebuffer(gpu, resolutionMultiplier)


        this.shader = new PostProcessingShader(gpu)
        this.noFxaaShader = new PostProcessingShader(gpu, true)


        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.selectedSystem = new SelectedSystem(gpu)
    }

    execute(options, systems, data) {
        super.execute()
        const  {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps
        } = data
        const {
            selected,
            camera,
            fxaa,
            iconsVisibility,
            gridVisibility,
            shadingModel
        } = options

        const meshSystem = systems.find(s => s instanceof MeshSystem)


        // SSR
        copyTexture(this.screenSpace.frameBufferObject, this.postProcessing.frameBufferObject, this.gpu, this.gpu.COLOR_BUFFER_BIT)

        this.postProcessing.startMapping()

        this.skyboxSystem.execute(skybox, camera)
        this.gridSystem.execute(gridVisibility, camera)
        this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility)

        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems)
        copyTexture(this.postProcessing.frameBufferObject, meshSystem.gBuffer.gBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)

        this.selectedSystem.execute(meshes, meshSources, selected, camera)


        this.postProcessing.stopMapping()

        let shaderToApply = this.shader

        if (!fxaa)
            shaderToApply = this.noFxaaShader

        shaderToApply.use()
        this.postProcessing.draw(shaderToApply)
    }
}