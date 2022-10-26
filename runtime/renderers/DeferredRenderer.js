import MaterialAPI from "../../api/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../../api/CameraAPI";
import GPUResources from "../../GPUResources";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";
import SSGIPass from "../SSGIPass";
import SSRPass from "../SSRPass";
import GPUController from "../../GPUController";


/**
 * "settings" uniform decomposition (vec4):
 * dirLightQuantity,   shadowMapResolution, shadowMapsQuantity, pointLightQuantity
 */

export default class DeferredRenderer {
    static gBuffer
    static deferredShader
    static compositeFBO
    static toScreenShader
    static positionSampler
    static normalSampler
    static albedoSampler
    static behaviourSampler
    static ambientSampler

    static ready = false
    static toScreenUniforms = {}
    static deferredUniforms = {}

    static initialize() {
        if (DeferredRenderer.ready)
            return

        DeferredRenderer.gBuffer = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
        DeferredRenderer.gBuffer
            .texture({attachment: 0, precision: window.gpu.RGBA32F, format: window.gpu.RGBA, type: window.gpu.FLOAT})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .texture({attachment: 3})
            .texture({attachment: 4})
            .depthTest()

        DeferredRenderer.positionSampler = DeferredRenderer.gBuffer.colors[0]
        DeferredRenderer.normalSampler = DeferredRenderer.gBuffer.colors[1]
        DeferredRenderer.albedoSampler = DeferredRenderer.gBuffer.colors[2]
        DeferredRenderer.behaviourSampler = DeferredRenderer.gBuffer.colors[3]
        DeferredRenderer.ambientSampler = DeferredRenderer.gBuffer.colors[4]



        DeferredRenderer.compositeFBO = GPUController.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEFERRED_COMPOSITION).texture()

        DeferredRenderer.toScreenUniforms.uSampler = DeferredRenderer.compositeFBO.colors[0]

        Object.assign(DeferredRenderer.deferredUniforms, {
            positionSampler: DeferredRenderer.positionSampler,
            normalSampler: DeferredRenderer.normalSampler,
            albedoSampler: DeferredRenderer.albedoSampler,
            behaviourSampler: DeferredRenderer.behaviourSampler,
            ambientSampler: DeferredRenderer.ambientSampler,
            cameraVec: CameraAPI.position,
            brdfSampler: GPUResources.BRDF,
            settings: new Float32Array(4)
        })

        SSGIPass.uniforms.previousFrame = DeferredRenderer.compositeFBO.colors[0]
        SSGIPass.uniforms.gPosition = DeferredRenderer.positionSampler

        SSRPass.uniforms.previousFrame = DeferredRenderer.compositeFBO.colors[0]
        SSRPass.uniforms.gPosition = DeferredRenderer.positionSampler
        SSRPass.uniforms.gNormal = DeferredRenderer.normalSampler
        SSRPass.uniforms.gBehaviour = DeferredRenderer.behaviourSampler

        DeferredRenderer.ready = true

        DeferredRenderer.uniforms = {
            cameraVec: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }
    }

    static drawFrame() {
        DeferredRenderer.toScreenShader.bindForUse(DeferredRenderer.toScreenUniforms)
        GPUResources.quad.draw()
    }

    static execute() {
        const {meshes, terrain} = Engine.data
        const u = DeferredRenderer.uniforms

        DeferredRenderer.gBuffer.startMapping()
        MaterialAPI.loopMeshes(
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isDeferredShaded)
                    return
                u.transformMatrix = current.matrix
                u.normalMatrix = current.normalMatrix

                MaterialAPI.drawMesh(
                    current.id,
                    mesh,
                    mat,
                    meshComponent,
                    u)
            }
        )

        MaterialAPI.loopTerrain(
            terrain,
            (mat, mesh, meshComponent, current) => {
                u.transformMatrix = current.matrix
                MaterialAPI.drawMesh(current.id, mesh, mat, meshComponent, u)
            }
        )

        DeferredRenderer.gBuffer.stopMapping()
    }

    static drawBuffer(entities, onWrap) {
        onWrap(false)
        DeferredRenderer.compositeFBO.startMapping()
        onWrap(true)

        DeferredRenderer.deferredShader.bindForUse(DeferredRenderer.deferredUniforms)
        GPUResources.quad.draw()
        DeferredRenderer.compositeFBO.stopMapping()
    }
}