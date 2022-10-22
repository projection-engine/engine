import * as shaderCode from "../../../templates/shaders/DEFERRED.glsl"
import MaterialAPI from "../../apis/rendering/MaterialAPI";
import Engine from "../../../Engine";
import CameraAPI from "../../apis/CameraAPI";
import GPU from "../../../GPU";
import ShadowMapPass from "./ShadowMapPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import SSGIPass from "./SSGIPass";
import SSRPass from "./SSRPass";

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

    static ready = false
    static toScreenUniforms = {}
    static deferredUniforms = {}

    static initialize() {
        if (DeferredPass.ready)
            return

        DeferredPass.gBuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.G_BUFFER)
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


        DeferredPass.deferredShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.DEFERRED, shaderCode.vertex, shaderCode.fragment)
        DeferredPass.compositeFBO = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.DEFERRED_COMPOSITION).texture()
        DeferredPass.toScreenShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.TO_SCREEN, shaderCode.vertex, shaderCode.toScreen)
        DeferredPass.toScreenUniforms.uSampler = DeferredPass.compositeFBO.colors[0]

        Object.assign(DeferredPass.deferredUniforms, {
            positionSampler: DeferredPass.positionSampler,
            normalSampler: DeferredPass.normalSampler,
            albedoSampler: DeferredPass.albedoSampler,
            behaviourSampler: DeferredPass.behaviourSampler,
            ambientSampler: DeferredPass.ambientSampler,
            cameraVec: CameraAPI.position,
            brdfSampler: GPU.BRDF,
            shadowCube0: ShadowMapPass.cubeMaps[0].texture,
            shadowCube1: ShadowMapPass.cubeMaps[1].texture,
            settings: new Float32Array(9)
        })
        DeferredPass.deferredUniforms.settings[2] = 1
        SSGIPass.uniforms.previousFrame = DeferredPass.compositeFBO.colors[0]
        SSGIPass.uniforms.gPosition = DeferredPass.positionSampler

        SSRPass.uniforms.previousFrame = DeferredPass.compositeFBO.colors[0]
        SSRPass.uniforms.gPosition = DeferredPass.positionSampler
        SSRPass.uniforms.gNormal = DeferredPass.normalSampler
        SSRPass.uniforms.gBehaviour = DeferredPass.behaviourSampler

        DeferredPass.ready = true

        DeferredPass.uniforms = {
            cameraVec: CameraAPI.position,
            viewMatrix: CameraAPI.viewMatrix,
            projectionMatrix: CameraAPI.projectionMatrix
        }
    }

    static drawFrame() {
        DeferredPass.toScreenShader.bindForUse(DeferredPass.toScreenUniforms)
        GPU.quad.draw()
    }

    static execute() {
        const {meshes, terrain} = Engine.data
        const u = DeferredPass.uniforms

        DeferredPass.gBuffer.startMapping()
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

        DeferredPass.gBuffer.stopMapping()
    }

    static drawBuffer(entities, onWrap) {
        onWrap(false)
        DeferredPass.compositeFBO.startMapping()
        onWrap(true)

        DeferredPass.deferredShader.bindForUse(DeferredPass.deferredUniforms)
        GPU.quad.draw()
        DeferredPass.compositeFBO.stopMapping()
    }
}