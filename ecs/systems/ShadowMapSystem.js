import System from "../basic/System";
import ShadowMapFramebuffer from "../../elements/buffer/shadows/ShadowMapFramebuffer";
import ShadowMapShader from "../../shaders/classes/shadows/ShadowMapShader";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import {bindTexture} from "../../utils/misc/utils";
import SYSTEMS from "../../utils/misc/SYSTEMS";

export default class ShadowMapSystem extends System {
    _needsGIUpdate = true
    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.resolutionPerTexture = 2048
        this.maxResolution = 2048
        this.shadowMapAtlas = new ShadowMapFramebuffer(this.maxResolution, gpu)
        this.shader = new ShadowMapShader(gpu)
    }
    set needsGIUpdate(_){
        this._needsGIUpdate = false
    }
    get needsGIUpdate(){
        return this._needsGIUpdate
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

        let changed = true//(systems[SYSTEMS.TRANSFORMATION].changed && views !== this._lightsCache ) || this._lightsCache.length === 0


        if (shadingModel === SHADING_MODELS.DETAIL && changed) {

            this._needsGIUpdate = true
            this.shader.use()
            const meshSystem = systems[SYSTEMS.MESH]
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
                        if (mesh !== undefined) {
                            let mat = injectMaterial ? injectMaterial : (mesh.material ? materials[mesh.material] : this.fallbackMaterial)
                            if(!mat || !mat.ready)
                                mat = meshSystem.fallbackMaterial
                            const t = current.components.TransformComponent

                            this._drawMesh(mesh, currentLight.lightView, currentLight.lightProjection, t.transformationMatrix, current.components.MeshComponent.normalMatrix, mat.albedo.texture, mat.normal.texture, currentLight.fixedColor)
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

    _drawMesh(mesh, viewMatrix, projectionMatrix, transformationMatrix, normalMatrix, albedo ,normal, lightColor) {

        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)
        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()

        this.gpu.uniformMatrix4fv(this.shader.transformMatrixULocation, false, transformationMatrix)
        this.gpu.uniformMatrix4fv(this.shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(this.shader.projectionMatrixULocation, false, projectionMatrix)
        this.gpu.uniformMatrix3fv(this.shader.normalMatrixULocation, false, normalMatrix)
        this.gpu.uniform3fv(this.shader.lightColorULocation,  lightColor)

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