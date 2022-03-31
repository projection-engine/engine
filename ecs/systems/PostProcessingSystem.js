import System from "../basic/System";
import DeferredSystem from "./subsystems/DeferredSystem";
import GridSystem from "./subsystems/GridSystem";
import BillboardSystem from "./subsystems/BillboardSystem";
import SkyboxSystem from "./subsystems/SkyboxSystem";
import GlobalIlluminationSystem from "./subsystems/gi/GlobalIlluminationSystem";
import SYSTEMS from "../../templates/SYSTEMS";
import Shader from "../../utils/workers/Shader";

import * as shaderCode from '../../shaders/misc/postProcessing.glsl'
import * as shaderCodePick from '../../shaders/misc/picker.glsl'
import FramebufferInstance from "../../instances/FramebufferInstance";
import TransparencySystem from "./subsystems/TransparencySystem";
import GizmoSystem from "./subsystems/GizmoSystem";
import {copyTexture} from "../../utils/misc/utils";
import RENDERING_TYPES from "../../templates/RENDERING_TYPES";


export default class PostProcessingSystem extends System {
    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.frameBuffer = new FramebufferInstance(gpu, window.screen.width * resolutionMultiplier, window.screen.height * resolutionMultiplier)
        this.frameBuffer
            .texture()
            .depthTest()

        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)
        this.noFxaaShader = new Shader(shaderCode.vertex, shaderCode.noFxaaFragment, gpu)
        this.FSRShader = new Shader(shaderCode.vertex, shaderCode.AMDFSR1, gpu)

        this.transparencySystem = new TransparencySystem(gpu)
        this.GISystem = new GlobalIlluminationSystem(gpu)
        this.skyboxSystem = new SkyboxSystem(gpu)
        this.deferredSystem = new DeferredSystem(gpu)
        this.gridSystem = new GridSystem(gpu)
        this.billboardSystem = new BillboardSystem(gpu)
        this.billboardSystem.initializeTextures().catch()
        this.gizmoSystem = new GizmoSystem(gpu)
    }

    execute(options, systems, data, entities, gizmo) {
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
            skylight,
            translucentMeshes
        } = data
        const {

            lockCamera,
            setSelected,
            selected,
            camera,
            typeRendering,
            iconsVisibility,
            gridVisibility,
            shadingModel,
            noRSM,
            gamma,
            exposure,
            rotationType,
            onGizmoChange
        } = options

        this.GISystem.execute(systems[SYSTEMS.SHADOWS], skylight, noRSM)

        this.frameBuffer.startMapping()

        this.skyboxSystem.execute(skybox, camera)
        this.gpu.disable(this.gpu.DEPTH_TEST)
        this.gridSystem.execute(gridVisibility, camera)
        this.gpu.enable(this.gpu.DEPTH_TEST)
        let giFBO, giGridSize
        if (!noRSM && skylight) {
            giGridSize = this.GISystem.size
            giFBO = this.GISystem.accumulatedBuffer
        }

        this.deferredSystem.execute(skybox, pointLights, directionalLights, spotLights, cubeMaps, camera, shadingModel, systems, giFBO, giGridSize, skylight, gamma, exposure)
        copyTexture(this.frameBuffer, systems[SYSTEMS.MESH].frameBuffer, this.gpu, this.gpu.DEPTH_BUFFER_BIT)


        this.gpu.enable(this.gpu.BLEND)
        this.gpu.blendFunc(this.gpu.SRC_ALPHA, this.gpu.ONE_MINUS_SRC_ALPHA)

        if (gizmo !== undefined)
            this.gizmoSystem.execute(meshes, meshSources, selected, camera, systems[SYSTEMS.PICK], lockCamera, entities, gizmo, rotationType, onGizmoChange)

        this.billboardSystem.execute(pointLights, directionalLights, spotLights, cubeMaps, camera, iconsVisibility, skylight)
        this.frameBuffer.stopMapping()

        let shaderToApply

        switch (typeRendering) {
            case RENDERING_TYPES.FSR:
                shaderToApply = this.FSRShader
                break
            case RENDERING_TYPES.DEFAULT:
                shaderToApply = this.noFxaaShader
                break
            default:
                shaderToApply = this.shader
                break
        }

        shaderToApply.use()
        shaderToApply.bindForUse({
            uSampler: this.frameBuffer.colors[0],

            FXAASpanMax: 8,
            FXAAReduceMin: 1 / 128,
            inverseFilterTextureSize: [1 / this.gpu.drawingBufferWidth, 1 / this.gpu.drawingBufferHeight, 0],
            FXAAReduceMul: 1 / 8
        })
        this.frameBuffer.draw()
    }
}