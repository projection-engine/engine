import System from "../basic/System";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import SYSTEMS from "../../utils/misc/SYSTEMS";
import * as rsmShaders from '../../shaders/gi/rsm.glsl'
import * as smShaders from '../../shaders/shadows/shadow.glsl'
import Shader from "../../utils/workers/Shader";
import Framebuffer from "../../instances/Framebuffer";

export default class ShadowMapSystem extends System {
    _needsGIUpdate = true

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 1024
        this.maxResolution = 4096
        this.rsmResolution = 512
        this.rsmFramebuffer = new Framebuffer(gpu, this.rsmResolution, this.rsmResolution)
        this.rsmFramebuffer
            .texture(undefined, undefined, 0)
            .texture(undefined, undefined, 1)
            .texture(undefined, undefined, 2)
            .depthTest()

        this.shadowsFrameBuffer = new Framebuffer(gpu, this.maxResolution, this.maxResolution)
        this.shadowsFrameBuffer
            .depthTexture()


        this.reflectiveShadowMapShader = new Shader(rsmShaders.vertex, rsmShaders.fragment, gpu)
        this.shadowMapShader = new Shader(smShaders.vertex, smShaders.fragment, gpu)
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
            injectMaterial,
            dataChanged,
            setDataChanged
        } = options


        let changed = systems[SYSTEMS.TRANSFORMATION].changed || dataChanged
        for (let i = 0; i < directionalLights.length; i++) {
            const current = directionalLights[i].components.DirectionalLightComponent
            changed = changed || current.changed

            current.changed = false
        }

        if (skylight) {
            changed = changed || skylight.changed

            skylight.changed = false
        }

        if (shadingModel === SHADING_MODELS.DETAIL && changed) {
            if (dataChanged)
                setDataChanged()
            this.shadowMapShader.use()
            const meshSystem = systems[SYSTEMS.MESH]
            let currentColumn = 0, currentRow = 0
            const maxLights = directionalLights.length + spotLights.length + (skylight ? 1 : 0)
            this.gpu.clearDepth(1);

            // this.gpu.cullFace(this.gpu.FRONT)
            this.shadowsFrameBuffer.startMapping()
            for (let face = 0; face < (this.maxResolution / this.resolutionPerTexture) ** 2; face++) {
                if (face < maxLights) {
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
                    this.gpu.enable(this.gpu.SCISSOR_TEST);
                    this.gpu.clear(this.gpu.DEPTH_BUFFER_BIT)


                    const isSpotLight = face > directionalLights.length - 1
                    let currentLight = isSpotLight ? spotLights[face]?.SpotLightComponent : directionalLights[face].components.DirectionalLightComponent

                    if (!currentLight)
                        currentLight = skylight
                    currentLight.atlasFace = [currentColumn, 0]

                    this.gpu.disable(this.gpu.SCISSOR_TEST);

                    this._loopMeshes(meshes, injectMaterial, meshSources, meshSystem, currentLight, materials, this.shadowMapShader)
                }
                if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                    currentColumn = 0
                    currentRow += 1
                } else
                    currentColumn += 1
            }
            this.shadowsFrameBuffer.stopMapping()
            this.gpu.cullFace(this.gpu.BACK)

            if (skylight) {
                this.needsGIUpdate = true

                this.reflectiveShadowMapShader.use()

                this.rsmFramebuffer.startMapping()
                this._loopMeshes(meshes, injectMaterial, meshSources, meshSystem, skylight, materials, this.reflectiveShadowMapShader)
                this.rsmFramebuffer.stopMapping()
            }

        }
    }

    _loopMeshes(meshes, injectMaterial, meshSources, meshSystem, currentLight, materials, shader) {
        for (let m = 0; m < meshes.length; m++) {
            const current = meshes[m]
            const mesh = meshSources[current.components.MeshComponent.meshID]
            if (mesh !== undefined) {
                const currentMaterialID = current.components.MaterialComponent.materialID
                let mat = injectMaterial ? injectMaterial : (materials[currentMaterialID] ? materials[currentMaterialID] : this.fallbackMaterial)
                if (!mat || !mat.ready)
                    mat = meshSystem.fallbackMaterial
                const t = current.components.TransformComponent

                this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix, mat.albedo.texture, mat.normal.texture, currentLight.fixedColor, shader)
            }
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformMatrix, albedo, normal, lightColor, shader) {
        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        if (shader === this.reflectiveShadowMapShader) {
            mesh.normalVBO.enable()
            mesh.uvVBO.enable()
        }

        shader.bindForUse({
            viewMatrix,
            transformMatrix,
            projectionMatrix,
            lightColor,
            albedoSampler: albedo,
            normalSampler: normal
        })

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.normalVBO.disable()
        mesh.uvVBO.disable()

    }
}