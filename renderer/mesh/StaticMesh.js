import Transformation from "./Transformation";
import randomID from "../../../components/shared/utils/randomID";

export default class StaticMesh extends Transformation {
    constructor(id = randomID(), name = 'New Static Mesh', meshIndex, materialIndex, gpu) {
        super();
        this.id = id
        this.name = name
        this.meshIndex = meshIndex
        this.materialIndex = materialIndex

        this.gpu = gpu

        this._updateNormalMatrix()
    }

    draw({
             shader,
             mesh,
             material,
             shadowMapTexture,
             directionalLight,
             cameraPosition,
             viewMatrix,
             projectionMatrix,
             lights,
             skyboxTexture,
             shadowMapResolution,
             irradianceMap
         }) {


        this.gpu.bindVertexArray(mesh.VAO)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()


        if (shader.constructor.name === 'MeshShader' || shader.constructor.name === 'OutlineShader') {
            mesh.normalVBO.enable()
            mesh.uvVBO.enable()
            mesh.tangentVBO.enable()

            if (shader.constructor.name === 'OutlineShader')
                shader.bindUniforms(
                    viewMatrix,
                    projectionMatrix,
                    this.transformationMatrix
                )
            else
                shader.bindUniforms({
                    irradianceMap,
                    skyboxTexture,
                    directionalLight,
                    shadowMapTexture,
                    shadowMapResolution,
                    material: material,
                    cameraVec: cameraPosition,
                    normalMatrix: this.normalMatrix,
                    lights: lights
                })
        }

        this.gpu.uniformMatrix4fv(shader.transformMatrixULocation, false, this.transformationMatrix)
        this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewMatrix)
        this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        this.gpu.drawElements(this.gpu.TRIANGLES, mesh.verticesQuantity, this.gpu.UNSIGNED_INT, 0)


        // EXIT
        this.gpu.bindVertexArray(null)
        this.gpu.bindBuffer(this.gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()
    }
}