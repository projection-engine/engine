import * as smShaders from "../../shaders/SHADOW_MAP.glsl"
import ProbeController from "../../instances/ProbeController"
import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../../static/COMPONENTS.json"
import EntityAPI from "../../apis/EntityAPI";
import Engine from "../../Engine";
import GPU from "../../GPU";
import STATIC_SHADERS from "../../../static/resources/STATIC_SHADERS";
import STATIC_FRAMEBUFFERS from "../../../static/resources/STATIC_FRAMEBUFFERS";
import PointLightComponent from "../../components/rendering/PointLightComponent";
import DeferredPass from "./DeferredPass";

export const VIEWS = {
    target: [
        [1., 0., 0.],
        [-1., 0., 0.],
        [0., 1., 0.],
        [0., -1., 0.],
        [0., 0., 1.],
        [0., 0., -1.],
    ],
    up: [
        [0., -1., 0.],
        [0., -1., 0.],
        [0., 0., 1.],
        [0., 0., -1.],
        [0., -1., 0.],
        [0., -1., 0.],
    ]
}

export default class ShadowMapPass {
    static changed = false
    static maxCubeMaps = 2
    static cubeMaps = []
    static resolutionPerTexture = 1024
    static maxResolution = 4096
    static shadowMapShader
    static shadowMapOmniShader
    static shadowsFrameBuffer
    static ready = false
    static lights2D = []
    static lights3D = []
static atlasRatio = 0
    static initialize() {

        ShadowMapPass.cubeMaps = [
            new ProbeController(512, true),
            new ProbeController(512, true)
        ]
        ShadowMapPass.allocateData()
        ShadowMapPass.shadowMapShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
        ShadowMapPass.shadowMapOmniShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
        ShadowMapPass.ready = true
    }

    static allocateData() {
        if (ShadowMapPass.shadowsFrameBuffer)
            GPU.destroyFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS)
        ShadowMapPass.shadowsFrameBuffer = GPU.allocateFramebuffer(STATIC_FRAMEBUFFERS.SHADOWS, ShadowMapPass.maxResolution, ShadowMapPass.maxResolution)
        ShadowMapPass.shadowsFrameBuffer.depthTexture()
        DeferredPass.deferredUniforms.shadowMapTexture = ShadowMapPass.shadowsFrameBuffer.depthSampler
    }

    static allocateBuffers(shadowAtlasQuantity, shadowMapResolution) {
        if (ShadowMapPass.maxResolution !== shadowMapResolution && shadowMapResolution) {
            ShadowMapPass.maxResolution = shadowMapResolution
            ShadowMapPass.allocateData()
            ShadowMapPass.changed = true
        }

        if (ShadowMapPass.maxResolution / shadowAtlasQuantity !== ShadowMapPass.resolutionPerTexture && shadowAtlasQuantity) {
            ShadowMapPass.resolutionPerTexture = ShadowMapPass.maxResolution / shadowAtlasQuantity
            ShadowMapPass.changed = true
        }
        ShadowMapPass.atlasRatio = ShadowMapPass.maxResolution / ShadowMapPass.resolutionPerTexture
    }

    static #generateToUpdateMap() {
        const arr = EntityAPI.lightsChanged
        const l = arr.length
        for (let i = 0; i < l; i++) {
            if(!arr[i].shadowMap)
                continue
            if (arr[i] instanceof PointLightComponent)
                ShadowMapPass.lights3D.push({...arr[i], translation: arr[i].__entity.translation})
            else
                ShadowMapPass.lights2D.push(arr[i])
        }

    }

    static execute() {
        if (!ShadowMapPass.ready || !ShadowMapPass.changed && EntityAPI.lightsChanged.length === 0)
            return;

        ShadowMapPass.#generateToUpdateMap()
        const lights2D = ShadowMapPass.lights2D
        const lights3D = ShadowMapPass.lights3D

        gpu.cullFace(gpu.FRONT)
        let currentColumn = 0, currentRow = 0
        if (lights2D.length > 0) {
            ShadowMapPass.shadowsFrameBuffer.startMapping()
            gpu.enable(gpu.SCISSOR_TEST)
            const size = ShadowMapPass.atlasRatio ** 2
            for (let face = 0; face < size; face++) {
                if (face < lights2D.length) {
                    const currentLight = lights2D[face]

                    gpu.viewport(
                        currentColumn * ShadowMapPass.resolutionPerTexture,
                        currentRow * ShadowMapPass.resolutionPerTexture,
                        ShadowMapPass.resolutionPerTexture,
                        ShadowMapPass.resolutionPerTexture
                    )
                    gpu.scissor(
                        currentColumn * ShadowMapPass.resolutionPerTexture,
                        currentRow * ShadowMapPass.resolutionPerTexture,
                        ShadowMapPass.resolutionPerTexture,
                        ShadowMapPass.resolutionPerTexture
                    )
                    gpu.clear(gpu.DEPTH_BUFFER_BIT)

                    currentLight.atlasFace = [currentColumn, 0]
                    ShadowMapPass.loopMeshes(ShadowMapPass.shadowMapShader, currentLight.lightView, currentLight.lightProjection, currentLight.fixedColor)
                }
                if (currentColumn > ShadowMapPass.atlasRatio) {
                    currentColumn = 0
                    currentRow += 1
                } else
                    currentColumn += 1
            }
            gpu.disable(gpu.SCISSOR_TEST)
            ShadowMapPass.shadowsFrameBuffer.stopMapping()
        }

        console.log(lights3D, ShadowMapPass.maxCubeMaps)
        if (lights3D.length > 0) {
            gpu.viewport(0, 0, 512, 512)
            for (let i = 0; i < ShadowMapPass.maxCubeMaps; i++) {
                const current = lights3D[i]
                if (!current)
                    continue
                console.log(ShadowMapPass.cubeMaps[i])
                ShadowMapPass.cubeMaps[i]
                    .draw((yaw, pitch, perspective, index) => {
                            const target = vec3.add([], current.translation, VIEWS.target[index])
                            ShadowMapPass.loopMeshes(
                                ShadowMapPass.shadowMapOmniShader,
                                mat4.lookAt([], current.translation, target, VIEWS.up[index]),
                                perspective,
                                undefined,
                                current.translation,
                                [current.zNear, current.zFar])
                        },
                        false,
                        current.zFar,
                        current.zNear
                    )
            }
        }
        gpu.cullFace(gpu.BACK)
        ShadowMapPass.changed = false
        ShadowMapPass.lights2D = []
        ShadowMapPass.lights3D = []
        EntityAPI.lightsChanged = []
    }

    static loopMeshes(shader, view, projection, color, lightPosition, shadowClipNearFar) {
        const meshes = Engine.data.meshes
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPU.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows)
                continue
            shader.bindForUse({
                shadowClipNearFar,
                viewMatrix: view,
                transformMatrix: current.matrix,
                projectionMatrix: projection,
                lightColor: color,
                lightPosition
            })
            mesh.draw()
        }
    }

}