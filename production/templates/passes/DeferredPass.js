import FramebufferInstance from "../../controllers/instances/FramebufferInstance"
import ShaderInstance from "../../controllers/instances/ShaderInstance"
import * as shaderCode from "../../data/shaders/DEFERRED.glsl"
import MaterialRenderer from "../../libs/MaterialRenderer";
import LoopController from "../../controllers/LoopController";
import RendererController from "../../controllers/RendererController";
import CameraAPI from "../../libs/apis/CameraAPI";
import GPU from "../../controllers/GPU";
import AOPass from "./AOPass";
import SSGIPass from "./SSGIPass";
import SSRPass from "./SSRPass";

let shadowMapSystem
export default class DeferredPass {
    static gBuffer
    static deferredShader
    static compositeFBO
    static toScreenShader
    static positionSampler
    static normalSampler
    static albedoSampler
    static behaviourSampler
    static ambientSampler

    static initialize() {
        DeferredPass.gBuffer = new FramebufferInstance()
        DeferredPass.gBuffer
            .texture({attachment: 0, precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()

        DeferredPass.positionSampler = DeferredPass.gBuffer.colors[0]
        DeferredPass.normalSampler = DeferredPass.gBuffer.colors[1]
        DeferredPass.albedoSampler = DeferredPass.gBuffer.colors[2]
        DeferredPass.behaviourSampler = DeferredPass.gBuffer.colors[3]
        DeferredPass.ambientSampler = DeferredPass.gBuffer.colors[4]

        DeferredPass.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        DeferredPass.compositeFBO = (new FramebufferInstance()).texture()
        DeferredPass.toScreenShader = new ShaderInstance(shaderCode.vertex, shaderCode.toScreen)
    }

    static drawFrame() {
        DeferredPass.toScreenShader.bindForUse({
            uSampler: DeferredPass.compositeFBO.colors[0]
        })
        GPU.quad.draw()
    }

    static execute() {
        const {
            meshes,
            materials
        } = RendererController.data

        const elapsed = RendererController.params.elapsed

        DeferredPass.gBuffer.startMapping()
        MaterialRenderer.loopMeshes(
            materials,
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isDeferredShaded)
                    return

                const ambient = MaterialRenderer.getEnvironment(current)
                MaterialRenderer.drawMesh({
                    mesh,
                    camPosition: CameraAPI.position,
                    viewMatrix: CameraAPI.viewMatrix,
                    projectionMatrix: CameraAPI.projectionMatrix,
                    transformMatrix: current.transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,
                    elapsed,
                    ambient,
                    onlyForward: false
                })
            }
        )
        DeferredPass.gBuffer.stopMapping()
    }

    static drawBuffer(entities, onWrap) {
        if (shadowMapSystem === undefined)
            shadowMapSystem = LoopController.renderMap.get("shadowMap")
        const {
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = RendererController.data
        const {
            ao,
            pcfSamples,
            ssr,
            ssgi
        } = RendererController.params

        onWrap(false)
        DeferredPass.compositeFBO.startMapping()
        onWrap(true)

        DeferredPass.deferredShader.bindForUse({
            screenSpaceGI: ssgi ? SSGIPass.sampler : undefined,
            screenSpaceReflections: ssr ? SSRPass.sampler : undefined,
            positionSampler: DeferredPass.positionSampler,
            normalSampler: DeferredPass.normalSampler,
            albedoSampler: DeferredPass.albedoSampler,
            behaviourSampler: DeferredPass.behaviourSampler,
            ambientSampler: DeferredPass.ambientSampler,
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            aoSampler: AOPass.filteredSampler,

            shadowCube0: shadowMapSystem?.specularProbes[0]?.texture,
            shadowCube1: shadowMapSystem?.specularProbes[1]?.texture,

            cameraVec: CameraAPI.position,
            settings: [
                maxTextures, shadowMapSystem.maxResolution, shadowMapSystem ? 0 : 1,
                shadowMapSystem.maxResolution / shadowMapSystem.resolutionPerTexture, pointLightsQuantity, ao ? 1 : 0,
                pcfSamples, 0, 0
            ],
            directionalLightsData,
            dirLightPOV,
            pointLightData
        })

        GPU.quad.draw()
        DeferredPass.compositeFBO.stopMapping()
    }
}