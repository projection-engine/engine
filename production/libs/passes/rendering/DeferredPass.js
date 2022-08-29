import FramebufferInstance from "../../instances/FramebufferInstance"
import ShaderInstance from "../../instances/ShaderInstance"
import * as shaderCode from "../../../data/shaders/DEFERRED.glsl"
import MaterialRenderer from "../../../services/MaterialRenderer";
import LoopAPI from "../../apis/LoopAPI";
import RendererController from "../../../RendererController";
import CameraAPI from "../../apis/CameraAPI";

let shadowMapSystem, aoTexture, ssGISystem, ssrSystem
export default class DeferredPass {
    constructor(resolution = {w: window.screen.width, h: window.screen.height}) {
        this.frameBuffer = new FramebufferInstance(resolution.w, resolution.h)
        this.frameBuffer
            .texture({attachment: 0, precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()

        this.deferredShader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
        this.deferredFBO = (new FramebufferInstance(resolution.w, resolution.h)).texture()
        this.toScreenShader = new ShaderInstance(shaderCode.vertex, shaderCode.toScreen)
    }

    drawFrame() {
        this.toScreenShader.bindForUse({
            uSampler: this.deferredFBO.colors[0]
        })
        this.deferredFBO.draw()
    }

    execute() {
        const {
            meshes,
            materials
        } = RendererController.data

        const elapsed = RendererController.params.elapsed

        this.frameBuffer.startMapping()
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
        this.frameBuffer.stopMapping()
    }

    drawBuffer(entities, onWrap) {
        if (aoTexture === undefined) {
            aoTexture = LoopAPI.renderMap.get("ao").texture
            ssGISystem = LoopAPI.renderMap.get("ssGI")
            ssrSystem = LoopAPI.renderMap.get("ssr")
            shadowMapSystem = LoopAPI.renderMap.get("shadowMap")
        }
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
        this.deferredFBO.startMapping()
        onWrap(true)

        this.deferredShader.bindForUse({
            screenSpaceGI: ssgi ? ssGISystem.color : undefined,
            screenSpaceReflections: ssr ? ssrSystem.color : undefined,
            positionSampler: this.frameBuffer.colors[0],
            normalSampler: this.frameBuffer.colors[1],
            albedoSampler: this.frameBuffer.colors[2],
            behaviourSampler: this.frameBuffer.colors[3],
            ambientSampler: this.frameBuffer.colors[4],
            shadowMapTexture: shadowMapSystem?.shadowsFrameBuffer?.depthSampler,
            aoSampler: aoTexture,

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

        this.deferredFBO.draw()
        this.deferredFBO.stopMapping()
    }
}