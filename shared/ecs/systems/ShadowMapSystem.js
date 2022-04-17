import System from "../basic/System";
import {SHADING_MODELS} from "../../../../pages/project/utils/hooks/useSettings";
import SYSTEMS from "../../templates/SYSTEMS";
import * as rsmShaders from '../../shaders/gi/rsm.glsl'
import * as smShaders from '../../shaders/shadows/shadow.glsl'
import Shader from "../../utils/workers/Shader";
import FramebufferInstance from "../../instances/FramebufferInstance";
import CubeMapInstance from "../../instances/CubeMapInstance";
import {mat4, vec3} from "gl-matrix";

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

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.maxCubeMaps = 2
        this.cubeMaps = [
            new CubeMapInstance(gpu, 512, true),
            new CubeMapInstance(gpu, 512, true)
        ]
        this.resolutionPerTexture = 1024
        this.maxResolution = 4096
        this.rsmResolution = 512
        this.rsmFramebuffer = new FramebufferInstance(gpu, this.rsmResolution, this.rsmResolution)
        this.rsmFramebuffer
            .texture(undefined, undefined, 0)
            .texture(undefined, undefined, 1)
            .texture(undefined, undefined, 2)
            .depthTest()

        this.shadowsFrameBuffer = new FramebufferInstance(gpu, this.maxResolution, this.maxResolution)
        this.shadowsFrameBuffer
            .depthTexture()

        this.reflectiveShadowMapShader = new Shader(rsmShaders.vertex, rsmShaders.fragment, gpu)


        this.shadowMapShader = new Shader(smShaders.vertex, smShaders.fragment, gpu)
        this.shadowMapOmniShader = new Shader(smShaders.vertex, smShaders.omniFragment, gpu)
    }

    set needsGIUpdate(data) {
        this._needsGIUpdate = data
    }

    get needsGIUpdate() {
        return this._needsGIUpdate
    }

    execute(options, systems, data) {
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
            skylight
        } = data

        let {
            shadingModel,
            dataChanged,
            setDataChanged
        } = options


        let lights2D = [], sky = false, lights3D = [], transformChanged = systems[SYSTEMS.TRANSFORMATION].changed
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i].components.DirectionalLightComponent
            if ((current.changed || transformChanged || skylight?.changed) && current.shadowMap) {
                lights2D.push(current)
                current.changed = false
            }
        }
        for (let i = 0; i < pointLights.length; i++) {
            const current = pointLights[i].components.PointLightComponent
            if ((current.changed || transformChanged) && current.shadowMap) {
                lights3D.push({...current, translation: pointLights[i].components.TransformComponent.position})
                current.changed = false
            }
        }
        if (skylight && (skylight.changed || lights2D.length > 0)) {
            sky = skylight.changed || transformChanged
            if (skylight.shadowMap && (lights2D.length > 0 || skylight.changed))
                lights2D.push(skylight)

            skylight.changed = false
        }


        if (shadingModel === SHADING_MODELS.DETAIL && (lights2D.length > 0 || lights3D.length > 0)) {
            this.gpu.cullFace(this.gpu.FRONT)
            if (dataChanged)
                setDataChanged()
            this.shadowMapShader.use()
            const meshSystem = systems[SYSTEMS.MESH]
            let currentColumn = 0, currentRow = 0

            this.gpu.clearDepth(1);

            if (lights2D.length > 0) {

                this.shadowsFrameBuffer.startMapping()
                this.gpu.enable(this.gpu.SCISSOR_TEST);

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
                        // TODO - USE MESH MATERIAL SHADER
                        this._loopMeshes(meshes, meshSources, meshSystem, materials, this.shadowMapShader, currentLight.lightView, currentLight.lightProjection, currentLight.fixedColor)
                    }
                    if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                        currentColumn = 0
                        currentRow += 1
                    } else
                        currentColumn += 1
                }
                this.gpu.disable(this.gpu.SCISSOR_TEST);
                this.shadowsFrameBuffer.stopMapping()

            }

            if (sky) {
                this.needsGIUpdate = true
                this.reflectiveShadowMapShader.use()

                this.rsmFramebuffer.startMapping()

                this._loopMeshes(meshes, meshSources, meshSystem, materials, this.reflectiveShadowMapShader, skylight.lightView, skylight.lightProjection, skylight.fixedColor)
                this.rsmFramebuffer.stopMapping()
            }
            if (lights3D.length > 0) {
                this.shadowMapOmniShader.use()
                this.gpu.viewport(
                    0,
                    0,
                    512,
                    512
                )

                for (let i = 0; i < this.maxCubeMaps; i++) {
                    const current = lights3D[i]
                    if (current) {
                        this.cubeMaps[i]
                            .draw((yaw, pitch, perspective, index) => {
                                    const target = vec3.add([], current.translation, VIEWS.target[index])
                                    this._loopMeshes(
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
            }
            this.gpu.cullFace(this.gpu.BACK)
        }

    }

    _loopMeshes(meshes, meshSources, meshSystem, materials, shader, view, projection, color, lightPosition, shadowClipNearFar) {
        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components.MeshComponent.meshID]
            if (mesh !== undefined) {
                const currentMaterialID = current.components.MaterialComponent.materialID
                let mat = materials[currentMaterialID] ? materials[currentMaterialID] : undefined
                if (!mat || !mat.ready)
                    mat = meshSystem.fallbackMaterial
                const t = current.components.TransformComponent

                this._drawMesh(mesh, view, projection, t.transformationMatrix, mat, color, shader, lightPosition, shadowClipNearFar)
            }
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformMatrix, mat, lightColor, shader, lightPosition, shadowClipNearFar) {
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
            // albedoSampler: matalbedo,
            // normalSampler: normal,
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