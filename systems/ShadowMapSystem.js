import System from "../basic/System"

import SYSTEMS from "../templates/SYSTEMS"
import * as rsmShaders from "../shaders/gi/rsm.glsl"
import * as smShaders from "../shaders/shadows/SHADOW_MAP.glsl"
import ShaderInstance from "../instances/ShaderInstance"
import FramebufferInstance from "../instances/FramebufferInstance"
import CubeMapInstance from "../instances/CubeMapInstance"
import {mat4, vec3} from "gl-matrix"
import COMPONENTS from "../templates/COMPONENTS"

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


export default class ShadowMapSystem extends System {
    _needsGIUpdate = true
    changed = false

    constructor(gpu) {
        super([])
        this.gpu = gpu
        this.maxCubeMaps = 2
        this.cubeMaps = [
            new CubeMapInstance(gpu, 512, true),
            new CubeMapInstance(gpu, 512, true)
        ]

        this.rsmResolution = 512
        this.rsmFramebuffer = new FramebufferInstance(gpu, this.rsmResolution, this.rsmResolution)
        this.rsmFramebuffer
            .texture({attachment: 0})
            .texture({attachment: 1})
            .texture({attachment: 2})
            .depthTest()


        this.resolutionPerTexture = 1024
        this.maxResolution = 4096
        this.updateFBOResolution()

        this.reflectiveShadowMapShader = new ShaderInstance(rsmShaders.vertex, rsmShaders.fragment, gpu)
        this.shadowMapShader = new ShaderInstance(smShaders.vertex, smShaders.fragment, gpu)
        this.shadowMapOmniShader = new ShaderInstance(smShaders.vertex, smShaders.omniFragment, gpu)
    }

    updateFBOResolution() {
        super.updateFBOResolution()

        if(this.shadowsFrameBuffer){
            this.gpu.deleteTexture(this.shadowsFrameBuffer.depthSampler)
            this.gpu.deleteFramebuffer(this.shadowsFrameBuffer.FBO)
        }

        this.shadowsFrameBuffer = new FramebufferInstance(this.gpu, this.maxResolution, this.maxResolution)
        this.shadowsFrameBuffer
            .depthTexture()
    }

    set needsGIUpdate(data) {
        this._needsGIUpdate = data
    }

    get needsGIUpdate() {
        return this._needsGIUpdate
    }

    #prepareBuffer(
        shadowAtlasQuantity,
        shadowMapResolution
    ) {
        if (this.maxResolution !== shadowMapResolution && shadowMapResolution) {
            this.maxResolution = shadowMapResolution
            this.updateFBOResolution()
            this.changed = true
        }
        if (this.maxResolution / shadowAtlasQuantity !== this.resolutionPerTexture && shadowAtlasQuantity) {
            this.resolutionPerTexture = this.maxResolution / shadowAtlasQuantity
            this.changed = true
        }

    }

    execute(options, systems, data) {
        super.execute()
        const {
            pointLights,
            meshes,
            directionalLights,
            materials,
            meshSources,
            skylight,
        } = data
        const {
            shadowAtlasQuantity,
            shadowMapResolution
        } = options

        this.#prepareBuffer(
            shadowAtlasQuantity,
            shadowMapResolution
        )


        let lights2D = [], sky = false, lights3D = [], transformChanged = systems[SYSTEMS.TRANSFORMATION]?.changed
        const dirL = directionalLights.length
        for (let i = 0; i < dirL; i++) {
            const current = directionalLights[i].components[COMPONENTS.DIRECTIONAL_LIGHT]
            if ((current.changed || transformChanged || skylight?.changed) && current.shadowMap || this.changed) {
                lights2D.push(current)
                current.changed = false
                this.changed = true
            }
        }
        const pL = pointLights.length
        for (let i = 0; i < pL; i++) {
            const current = pointLights[i].components[COMPONENTS.POINT_LIGHT]

            if ((current.changed || transformChanged) && current.shadowMap) {
                lights3D.push({...current, translation: pointLights[i].components[COMPONENTS.TRANSFORM].position})
                current.changed = false
                this.changed = true
            }
        }
        if (skylight && (skylight.changed || lights2D.length > 0)) {
            sky = skylight.changed || transformChanged
            if (skylight.shadowMap && (lights2D.length > 0 || skylight.changed)|| this.changed)
                lights2D.push(skylight)

            skylight.changed = false
        }


        if (this.changed) {
            this.changed = false
            this.gpu.cullFace(this.gpu.FRONT)
            this.shadowMapShader.use()
            const meshSystem = systems[SYSTEMS.MESH]
            let currentColumn = 0, currentRow = 0
            this.gpu.clearDepth(1)
            if (lights2D.length > 0) {
                this.shadowsFrameBuffer.startMapping()
                this.gpu.enable(this.gpu.SCISSOR_TEST)
                for (let face = 0; face < (this.maxResolution / this.resolutionPerTexture) ** 2; face++) {
                    if (face < lights2D.length) {
                        this.gpu.viewport(
                            currentColumn * this.resolutionPerTexture,
                            currentRow * this.resolutionPerTexture,
                            this.resolutionPerTexture,
                            this.resolutionPerTexture
                        )
                        this.gpu.scissor(
                            currentColumn * this.resolutionPerTexture,
                            currentRow * this.resolutionPerTexture,
                            this.resolutionPerTexture,
                            this.resolutionPerTexture
                        )

                        this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)

                        let currentLight = lights2D[face]
                        currentLight.atlasFace = [currentColumn, 0]

                        this.#loopMeshes(meshes, meshSources, meshSystem, materials, this.shadowMapShader, currentLight.lightView, currentLight.lightProjection, currentLight.fixedColor)
                    }
                    if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                        currentColumn = 0
                        currentRow += 1
                    } else
                        currentColumn += 1
                }
                this.gpu.disable(this.gpu.SCISSOR_TEST)
                this.shadowsFrameBuffer.stopMapping()

            }

            if (sky) {
                this.needsGIUpdate = true
                this.reflectiveShadowMapShader.use()
                this.rsmFramebuffer.startMapping()

                // TODO - USE MESH MATERIAL SHADER
                this.#loopMeshes(meshes, meshSources, meshSystem, materials, this.reflectiveShadowMapShader, skylight.lightView, skylight.lightProjection, skylight.fixedColor)
                this.rsmFramebuffer.stopMapping()
            }
            if (lights3D.length > 0) {
                this.shadowMapOmniShader.use()
                this.gpu.viewport(0, 0, 512, 512)
                for (let i = 0; i < this.maxCubeMaps; i++) {
                    const current = lights3D[i]
                    if (current)
                        this.cubeMaps[i]
                            .draw((yaw, pitch, perspective, index) => {
                                const target = vec3.add([], current.translation, VIEWS.target[index])
                                this.#loopMeshes(
                                    meshes,
                                    meshSources,
                                    meshSystem,
                                    materials,
                                    this.shadowMapOmniShader,
                                    mat4.lookAt([], current.translation, target, VIEWS.up[index]),
                                    perspective,
                                    undefined,
                                    current.translation,
                                    [current.zNear, current.zFar])
                            },
                            false,
                            current.zFar,
                            current.zNear)
                }
            }
            this.gpu.cullFace(this.gpu.BACK)
        }

    }

    #loopMeshes(meshes, meshSources, meshSystem, materials, shader, view, projection, color, lightPosition, shadowClipNearFar) {
        const l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components[COMPONENTS.MESH].meshID]
            if (mesh !== undefined) {
                const currentMaterialID = current.components[COMPONENTS.MATERIAL].materialID
                let mat = materials[currentMaterialID] ? materials[currentMaterialID] : undefined
                if (!mat || !mat.ready)
                    mat = meshSystem.fallbackMaterial
                const t = current.components[COMPONENTS.TRANSFORM]

                this.#drawMesh(mesh, view, projection, t.transformationMatrix, mat, color, shader, lightPosition, shadowClipNearFar)
            }
        }
    }

    #drawMesh(mesh, viewMatrix, projectionMatrix, transformMatrix, mat, lightColor, shader, lightPosition, shadowClipNearFar) {
        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        if (shader === this.reflectiveShadowMapShader) {
            mesh.normalVBO.enable()
            mesh.uvVBO.enable()
        }


        shader.bindForUse({
            shadowClipNearFar,
            viewMatrix,
            transformMatrix,
            projectionMatrix,
            lightColor,
            albedoSampler: mat?.rsmAlbedo,

            lightPosition
        })


        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.normalVBO.disable()
        mesh.uvVBO.disable()

    }
}