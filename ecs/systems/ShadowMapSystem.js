import System from "../basic/System";
import ShadowMapFramebuffer from "../../elements/buffer/ShadowMapFramebuffer";
import ShadowMapShader from "../../shaders/classes/ShadowMapShader";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import {bindTexture} from "../../utils/misc/utils";
import MeshSystem from "./MeshSystem";
import seed from 'seed-random'
import ImageProcessor from "../../../workers/ImageProcessor";
import TextureInstance from "../../elements/instances/TextureInstance";
export default class ShadowMapSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 4092
        this.maxResolution = 4092
        this.shadowMapAtlas = new ShadowMapFramebuffer(this.maxResolution, gpu)
        this.shader = new ShadowMapShader(gpu)



    }

    execute(options, systems, data) {
        super.execute()
        const  {
            pointLights,
            spotLights,
            terrains,
            meshes,
            skybox,
            directionalLights,
            materials,
            meshSources,
            cubeMaps,

        } = data

        const {
            shadingModel,
            injectMaterial
        } = options
        if (shadingModel === SHADING_MODELS.DETAIL ) {
            this.shader.use()
            const meshSystem = systems.find(s => s instanceof MeshSystem)
            let currentColumn = 0, currentRow = 0
            const maxLights = directionalLights.length + spotLights.length

            this.gpu.clearDepth(1);
            this.shadowMapAtlas.startMapping()

            // this.gpu.cullFace(this.gpu.FRONT)

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
                    const currentLight = isSpotLight ? spotLights[face].SpotLightComponent : directionalLights[face].components.DirectionalLightComponent
                    currentLight.atlasFace = [currentColumn, 0]

                    this.gpu.disable(this.gpu.SCISSOR_TEST);
                    for (let m = 0; m < meshes.length; m++) {
                        const current = meshes[m]
                        const mesh =  meshSources[current.components.MeshComponent.meshID]
                        let mat = injectMaterial ? injectMaterial : (mesh.material ? materials[mesh.material] : this.fallbackMaterial)
                        if(!mat || !mat.ready)
                            mat = meshSystem.fallbackMaterial

                        if (mesh !== undefined) {
                            const t = current.components.TransformComponent
                            this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix, current.components.MeshComponent.normalMatrix, mat.albedo.texture, mat.normal.texture)
                        }
                    }


                }
                if (currentColumn > this.maxResolution / this.resolutionPerTexture) {
                    currentColumn = 0
                    currentRow += 1
                } else
                    currentColumn += 1
            }

            this.shadowMapAtlas.stopMapping()
        }
    }

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix, normalMatrix, albedo ,normal) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()

        this.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.uniformMatrix3fv(this.shader.normalMatrixULocation, false, normalMatrix)
        bindTexture(0, albedo, this.shader.albedoULocation, this.gpu)
        bindTexture(1, normal, this.shader.normalULocation, this.gpu)

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.normalVBO.disable()
        mesh.uvVBO.disable()

    }
}