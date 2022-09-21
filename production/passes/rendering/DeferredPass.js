import * as shaderCode from "../../shaders/DEFERRED.glsl"
import MaterialAPI from "../../apis/rendering/MaterialAPI";
import Engine from "../../Engine";
import CameraAPI from "../../apis/camera/CameraAPI";
import GPU from "../../GPU";
import ShadowMapPass from "./ShadowMapPass";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import QuadAPI from "../../apis/rendering/QuadAPI";
import STATIC_TEXTURES from "../../../static/resources/STATIC_TEXTURES";
import SSGIPass from "./SSGIPass";

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
            shadowCube0: ShadowMapPass.specularProbes[0].texture,
            shadowCube1: ShadowMapPass.specularProbes[1].texture,
            settings: new Float32Array(9)
        })
        DeferredPass.deferredUniforms.settings[2] = 1
        SSGIPass.lastFrame = DeferredPass.compositeFBO.colors[0]
        DeferredPass.ready = true
    }

    static drawFrame() {
        DeferredPass.toScreenShader.bindForUse(DeferredPass.toScreenUniforms)
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
                        normalMatrix: current.normalMatrix
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
            pcfSamples
        } = Engine.params


        onWrap(false)
        DeferredPass.compositeFBO.startMapping()
        onWrap(true)
        const U = DeferredPass.deferredUniforms
        U.directionalLightsData = directionalLightsData
        U.dirLightPOV = dirLightPOV
        U.pointLightData = pointLightData

        const settingsBuffer = U.settings
        settingsBuffer[0] = maxTextures
        settingsBuffer[1] = ShadowMapPass.maxResolution
        settingsBuffer[3] = ShadowMapPass.atlasRatio
        settingsBuffer[4] = pointLightsQuantity
        settingsBuffer[5] = ao ? 1 : 0
        settingsBuffer[6] = pcfSamples

        DeferredPass.deferredShader.bindForUse(U)

        QuadAPI.draw()
        DeferredPass.compositeFBO.stopMapping()
    }
}