import System from "../basic/System";
import ShadowMapFramebuffer from "../../elements/buffer/ShadowMapFramebuffer";
import ShadowMapShader from "../../shaders/classes/ShadowMapShader";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";

export default class ShadowMapSystem extends System {

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 1024
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
            cubeMaps
        } = data

        const {
            shadingModel
        } = options
        if (shadingModel === SHADING_MODELS.DETAIL) {
            this.shader.use()

            let currentColumn = 0, currentRow = 0
            const maxLights = directionalLights.length + spotLights.length

            this.gpu.clearDepth(1);
            this.shadowMapAtlas.startMapping()

            this.gpu.cullFace(this.gpu.FRONT)

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
                        if (mesh !== undefined) {
                            const t = current.components.TransformComponent
                            this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix)
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

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()
        this.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)

        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()

    }
}