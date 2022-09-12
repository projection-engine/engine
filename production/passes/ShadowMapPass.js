import * as smShaders from "../shaders/SHADOW_MAP.glsl"
import FramebufferInstance from "../instances/FramebufferInstance"
import CubeMapInstance from "../instances/CubeMapInstance"
import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../../static/COMPONENTS"
import BundlerAPI from "../apis/BundlerAPI";
import Engine from "../Engine";
import GPU from "../GPU";
import STATIC_SHADERS from "../../static/resources/STATIC_SHADERS";

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
    static specularProbes = []
    static resolutionPerTexture = 1024
    static maxResolution = 4096
    static shadowMapShader
    static shadowMapOmniShader
    static shadowsFrameBuffer
    static ready = false

    static initialize() {

        ShadowMapPass.specularProbes = [
            new CubeMapInstance(512, true),
            new CubeMapInstance(512, true)
        ]
        ShadowMapPass.allocateData()
        ShadowMapPass.shadowMapShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.DIRECT_SHADOWS, smShaders.vertex, smShaders.fragment)
        ShadowMapPass.shadowMapOmniShader = GPU.allocateShader(STATIC_SHADERS.PRODUCTION.OMNIDIRECTIONAL_SHADOWS, smShaders.vertex, smShaders.omniFragment)
        ShadowMapPass.ready = true
    }

    static allocateData() {
        if (ShadowMapPass.shadowsFrameBuffer) {
            gpu.deleteTexture(ShadowMapPass.shadowsFrameBuffer.depthSampler)
            gpu.deleteFramebuffer(ShadowMapPass.shadowsFrameBuffer.FBO)
        }

        ShadowMapPass.shadowsFrameBuffer = new FramebufferInstance(ShadowMapPass.maxResolution, ShadowMapPass.maxResolution)
        ShadowMapPass.shadowsFrameBuffer
            .depthTexture()
    }


    static allocateBuffers(
        shadowAtlasQuantity,
        shadowMapResolution
    ) {
        if (ShadowMapPass.maxResolution !== shadowMapResolution && shadowMapResolution) {
            ShadowMapPass.maxResolution = shadowMapResolution
            ShadowMapPass.allocateData()
            ShadowMapPass.changed = true
        }
        if (ShadowMapPass.maxResolution / shadowAtlasQuantity !== ShadowMapPass.resolutionPerTexture && shadowAtlasQuantity) {
            ShadowMapPass.resolutionPerTexture = ShadowMapPass.maxResolution / shadowAtlasQuantity
            ShadowMapPass.changed = true
        }

    }

    static execute() {
        if (!ShadowMapPass.ready)
            return
        const {
            pointLights,
            directionalLights,
            meshes
        } = Engine.data
        const {
            shadowAtlasQuantity,
            shadowMapResolution
        } = Engine.params

        ShadowMapPass.allocateBuffers(
            shadowAtlasQuantity,
            shadowMapResolution
        )

        let lights2D = [], lights3D = []
        const dirL = directionalLights.length
        for (let i = 0; i < dirL; i++) {
            if (!directionalLights[i].active)
                continue
            const current = directionalLights[i].components.get(COMPONENTS.DIRECTIONAL_LIGHT)
            if (!current)
                continue
            if ((current.changed && current.shadowMap) || ShadowMapPass.changed) {
                lights2D.push(current)
                current.changed = false
                ShadowMapPass.changed = true
            }
        }
        const pL = pointLights.length
        for (let i = 0; i < pL; i++) {
            if (!pointLights[i].active)
                continue
            const current = pointLights[i].components.get(COMPONENTS.POINT_LIGHT)
            if (current?.changed && current.shadowMap) {
                lights3D.push({...current, translation: pointLights[i].translation})
                current.changed = false
                ShadowMapPass.changed = true
            }
        }


        if (ShadowMapPass.changed) {
            BundlerAPI.packageLights()
            ShadowMapPass.changed = false
            gpu.cullFace(gpu.FRONT)
            let currentColumn = 0, currentRow = 0
            if (lights2D.length > 0) {
                ShadowMapPass.shadowsFrameBuffer.startMapping()
                gpu.enable(gpu.SCISSOR_TEST)
                for (let face = 0; face < (ShadowMapPass.maxResolution / ShadowMapPass.resolutionPerTexture) ** 2; face++) {
                    if (face < lights2D.length) {
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

                        let currentLight = lights2D[face]
                        currentLight.atlasFace = [currentColumn, 0]

                        ShadowMapPass.loopMeshes(meshes, ShadowMapPass.shadowMapShader, currentLight.lightView, currentLight.lightProjection, currentLight.fixedColor)
                    }
                    if (currentColumn > ShadowMapPass.maxResolution / ShadowMapPass.resolutionPerTexture) {
                        currentColumn = 0
                        currentRow += 1
                    } else
                        currentColumn += 1
                }
                gpu.disable(gpu.SCISSOR_TEST)
                ShadowMapPass.shadowsFrameBuffer.stopMapping()

            }

            if (lights3D.length > 0) {
                gpu.viewport(0, 0, 512, 512)
                for (let i = 0; i < ShadowMapPass.maxCubeMaps; i++) {
                    const current = lights3D[i]
                    if (!current)
                        continue
                    ShadowMapPass.specularProbes[i]
                        .draw((yaw, pitch, perspective, index) => {
                                const target = vec3.add([], current.translation, VIEWS.target[index])
                                ShadowMapPass.loopMeshes(
                                    meshes,
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
        }
    }

    static loopMeshes(meshes, shader, view, projection, color, lightPosition, shadowClipNearFar) {
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m], meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = GPU.meshes.get(meshComponent.meshID)
            if (!mesh || !meshComponent.castsShadows)
                continue
            ShadowMapPass.drawMesh(mesh, view, projection, current.matrix, color, shader, lightPosition, shadowClipNearFar)
        }
    }

    static drawMesh(mesh, viewMatrix, projectionMatrix, transformMatrix, lightColor, shader, lightPosition, shadowClipNearFar) {
        shader.bindForUse({
            shadowClipNearFar,
            viewMatrix,
            transformMatrix,
            projectionMatrix,
            lightColor,
            lightPosition
        })
        mesh.draw()
    }
}