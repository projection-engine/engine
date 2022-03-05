import System from "../basic/System";
import GBuffer from "../../elements/buffer/mics/GBuffer";
import MaterialInstance from "../../elements/instances/MaterialInstance";
import {SHADING_MODELS} from "../../../../pages/project/hook/useSettings";
import * as shaderCode from '../../shaders/resources/mesh/meshDeferred.glsl'
import Shader from "../../utils/workers/Shader";

export default class MeshSystem extends System {
    _ready = false

    constructor(gpu, resolutionMultiplier) {
        super([]);
        this.gpu = gpu
        this.gBuffer = new GBuffer(gpu, resolutionMultiplier)
        this.shader = new Shader(shaderCode.vertex, shaderCode.fragment, gpu)

    }

    async initializeTextures() {
        this.fallbackMaterial = new MaterialInstance(this.gpu, undefined, 0)
        await this.fallbackMaterial.initializeTextures()
        this._ready = true
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
            cubeMaps
        } = data

        if (this._ready) {

            const {
                camera,
                selected,
                shadingModel,
                injectMaterial
            } = options


            this.shader.use()
            this.gpu.clearDepth(1);
            this.gBuffer.startMapping()

            for (let m = 0; m < meshes.length; m++) {
                const current = meshes[m]
                const mesh = meshSources[current.components.MeshComponent.meshID]

                if (mesh !== undefined && (!selected || !selected.includes(current.id))) {
                    const t = current.components.TransformComponent
                    const currentMaterial = materials[current.components.MaterialComponent.materialID]

                    let mat = currentMaterial ? currentMaterial : injectMaterial && !current.components.MaterialComponent.overrideInjection? injectMaterial : this.fallbackMaterial
                    if (!mat || !mat.ready)
                        mat = this.fallbackMaterial
                    MeshSystem.drawMesh(
                        this.shader,
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
        transformMatrix,
        material,
        normalMatrix,
        indexSelected) {

        gpu.bindVertexArray(mesh.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

        mesh.vertexVBO.enable()
        mesh.normalVBO.enable()
        mesh.uvVBO.enable()
        mesh.tangentVBO.enable()
        let materialAttrs = {}

        if (material) {
            materialAttrs = {
                pbrMaterial: {
                    albedo: material.albedo.texture,
                    metallic: material.metallic.texture,
                    roughness: material.roughness.texture,
                    normal: material.normal.texture,
                    height: material.height.texture,
                    ao: material.ao.texture
                },
                heightScale: material.parallaxHeightScale,
                layers: material.parallaxLayers,
                parallaxEnabled: material.parallaxEnabled,
            }
        }

        shader.bindForUse({
            ...materialAttrs,
            projectionMatrix,
            transformMatrix,
            viewMatrix,
            cameraVec: camPosition,

            normalMatrix,
            indexSelected
        })

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        gpu.bindVertexArray(null)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, null)
        mesh.vertexVBO.disable()
        mesh.uvVBO.disable()
        mesh.normalVBO.disable()
        mesh.tangentVBO.disable()


    }
}