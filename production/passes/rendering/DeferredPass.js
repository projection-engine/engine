import FramebufferController from "../../instances/FramebufferController"
import * as shaderCode from "../../shaders/DEFERRED.glsl"
import MaterialAPI from "../../apis/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../../apis/camera/CameraAPI";
import GPU from "../../GPU";
import AOPass from "./AOPass";
import SSGIPass from "./SSGIPass";
import SSRPass from "./SSRPass";
import ShadowMapPass from "./ShadowMapPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import QuadAPI from "../../apis/rendering/QuadAPI";

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
    }

    static drawFrame() {
        DeferredPass.toScreenShader.bindForUse({
            uSampler: DeferredPass.compositeFBO.colors[0]
        })
        QuadAPI.draw()
    }

    static execute() {
        const {meshes} = Engine.data


        DeferredPass.gBuffer.startMapping()
        MaterialAPI.loopMeshes(
            meshes,
            (mat, mesh, meshComponent, current) => {
                if (!mat.isDeferredShaded)
                    return
                MaterialAPI.drawMesh(
                    current.id,
                    mesh,
                    mat,
                    meshComponent,
                    {
                        cameraVec: CameraAPI.position,
                        viewMatrix: CameraAPI.viewMatrix,
                        projectionMatrix: CameraAPI.projectionMatrix,
                        transformMatrix: current.matrix,
                        normalMatrix: current.normalMatrix,
                        materialComponent: meshComponent
                    })
            }
        )
        DeferredPass.gBuffer.stopMapping()
    }

    static drawBuffer(entities, onWrap) {

        const {
            pointLightsQuantity,
            maxTextures,
            directionalLightsData,
            dirLightPOV,
            pointLightData
        } = Engine.data
        const {
            ao,
            pcfSamples,
            ssr,
            ssgi
        } = Engine.params

        onWrap(false)
        DeferredPass.compositeFBO.startMapping()
        onWrap(true)
        const uniforms = {
            screenSpaceGI: ssgi ? SSGIPass.sampler : undefined,
            screenSpaceReflections: ssr ? SSRPass.sampler : undefined,
            positionSampler: DeferredPass.positionSampler,
            normalSampler: DeferredPass.normalSampler,
            albedoSampler: DeferredPass.albedoSampler,
            behaviourSampler: DeferredPass.behaviourSampler,
            ambientSampler: DeferredPass.ambientSampler,
            aoSampler: AOPass.filteredSampler,
            cameraVec: CameraAPI.position,
            directionalLightsData,
            dirLightPOV,
            pointLightData,
            settings: [
                maxTextures, ShadowMapPass.maxResolution,
                ShadowMapPass.ready ? 0 : 1,
                ShadowMapPass.maxResolution / ShadowMapPass.resolutionPerTexture,
                pointLightsQuantity, ao ? 1 : 0,
                pcfSamples, 0, 0
            ]
        }
        if (ShadowMapPass.ready) {
            uniforms.shadowMapTexture = ShadowMapPass.shadowsFrameBuffer.depthSampler
            uniforms.shadowCube0 = ShadowMapPass.specularProbes[0].texture
            uniforms.shadowCube1 = ShadowMapPass.specularProbes[1].texture
        }
        DeferredPass.deferredShader.bindForUse(uniforms)

        QuadAPI.draw()
        DeferredPass.compositeFBO.stopMapping()
    }
}