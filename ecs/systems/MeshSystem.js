import System from "../basic/System";

import GBuffer from "../../elements/buffer/mics/GBuffer";
import MeshShader from "../../shaders/classes/mesh/MeshShader";
import MaterialInstance from "../../elements/instances/MaterialInstance";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import WireframeShader from "../../shaders/classes/misc/WireframeShader";

export default class MeshSystem extends System {
    _ready = false

    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.gBuffer = new GBuffer(gpu, resolutionMultiplier)
        this.shader = new MeshShader(gpu)
        this.wireframeShader = new WireframeShader(gpu)
    }

    async initializeTextures() {
        this.fallbackMaterial = new MaterialInstance(this.gpu, undefined, 0)
        await this.fallbackMaterial.initializeTextures()
        this._ready = true
    }

    _getDeferredShader(shadingModel) {
        switch (shadingModel) {
            case SHADING_MODELS.FLAT:
                return this.shader
            case SHADING_MODELS.DETAIL:
                return this.shader
            case SHADING_MODELS.WIREFRAME:
                return this.wireframeShader
            default:
                return this.shader
        }
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

        if (this._ready) {

            const {
                camera,
                selected,
                shadingModel,
                injectMaterial
            } = options


            const shaderToUse = this._getDeferredShader(shadingModel)

            shaderToUse.use()
            this.gpu.clearDepth(1);
            this.gBuffer.startMapping()

            for (let m = 0; m < meshes.length; m++) {
                const current = meshes[m]
                const mesh =  meshSources[current.components.MeshComponent.meshID]

                if (mesh !== undefined && (!selected|| !selected.includes(current.id))) {
                    const t = current.components.TransformComponent
                    const currentMaterialID = current.components.MaterialComponent.materialID

                    let mat = injectMaterial ? injectMaterial : (materials[currentMaterialID] ? materials[currentMaterialID] : this.fallbackMaterial)
                    if(!mat || !mat.ready)
                        mat = this.fallbackMaterial
                    MeshSystem.drawMesh(
                        shaderToUse,
                        this.gpu,
                        mesh,
                        camera.position,
                        camera.viewMatrix,
                        camera.projectionMatrix,
                        t.transformationMatrix,
                        mat,
                        current.components.MeshComponent.normalMatrix,
                        shadingModel === SHADING_MODELS.WIREFRAME
                    )
                }
            }
            this.gBuffer.stopMapping()
        }

    }

    static drawMesh(
        shader,
        gpu,
        mesh,
        camPosition,
        viewMatrix,
        projectionMatrix,
        transformationMatrix,
        material,
        normalMatrix,
        asWireframe) {

        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()




        shader
            .bindUniforms({
                material: material,
                cameraVec: camPosition,
                normalMatrix: normalMatrix
            })

        gpu.uniformMatrix4fv(shader.transformMatrixULocation, false, transformationMatrix)
        gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, viewMatrix)
        gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()


    }
}