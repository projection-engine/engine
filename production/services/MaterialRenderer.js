import LoopAPI from "../libs/apis/LoopAPI";
import RendererController from "../RendererController";
import COMPONENTS from "../data/COMPONENTS";


export default class MaterialRenderer {
    static draw(mesh, material) {
        if (material.settings.depthTest === false)
            gpu.disable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.disable(gpu.BLEND)

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        if (material.settings.depthTest === false)
            gpu.enable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.enable(gpu.BLEND)
    }

    static getEnvironment(entity) {
        const renderMap = LoopAPI.renderMap
        const specular = renderMap.get("specularProbe").probes[entity.id]
        const diffuse = renderMap.get("diffuseProbe").probes[entity.id]

        if (diffuse)
            return {
                irradiance0: diffuse[0]?.texture,
                irradiance1: diffuse[1]?.texture,
                irradiance2: diffuse[2]?.texture,

                prefilteredMap: specular?.texture,
                ambientLODSamples: specular?.mipmaps
            }
        return {
            prefilteredMap: specular?.texture,
            ambientLODSamples: specular?.mipmaps
        }
    }

    static drawMesh(attributes, directDrawing = false) {
        const {
            useCubeMapShader,
            mesh,
            camPosition,
            viewMatrix,
            projectionMatrix,
            transformMatrix,
            material,
            normalMatrix,
            directionalLightsQuantity,
            directionalLightsData,
            dirLightPOV,
            pointLightsQuantity,
            pointLightData,
            elapsed,
            ambient,
            sceneColor,
            ao
        } = attributes

        if (!mesh || !material)
            return
        mesh.use()
        material.use(
            {
                ...ambient,
                projectionMatrix,
                transformMatrix,
                viewMatrix,
                normalMatrix,
                sceneColor,
                brdfSampler: RendererController.BRDF,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                directionalLightsData,
                directionalLightsQuantity,
                dirLightPOV,
                aoSampler: ao,
                lightQuantity: pointLightsQuantity,
                pointLightData
            },
            useCubeMapShader
        )
        if (directDrawing)
            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        else
            MaterialRenderer.draw(mesh, material)
    }

    static drawProbe(view, projection, cubeMapPosition,) {

        const {
                meshes, materials,
                directionalLightsData,
                dirLightPOV, pointLightsQuantity, pointLightData,
                maxTextures
            } = RendererController.data,
            {elapsed} = RendererController.params,
            l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = RendererController.meshes.get(meshComponent.meshID)

            if (mesh !== undefined) {
                const currentMaterial = materials[meshComponent.materialID]
                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : RendererController.fallbackMaterial
                if (!mat || !mat.ready)
                    mat = RendererController.fallbackMaterial
                const ambient = MaterialRenderer.getEnvironment(current)
                MaterialRenderer.drawMesh({
                    ambient,
                    mesh,
                    camPosition: cubeMapPosition,
                    viewMatrix: view,
                    projectionMatrix: projection,
                    transformMatrix: current.components[COMPONENTS.TRANSFORM].transformationMatrix,
                    material: mat,
                    normalMatrix: meshComponent.normalMatrix,
                    materialComponent: meshComponent,
                    directionalLightsQuantity: maxTextures,
                    directionalLightsData,
                    dirLightPOV,
                    pointLightsQuantity,
                    pointLightData,
                    elapsed,
                    useCubeMapShader: true
                })
            }
        }
        gpu.bindVertexArray(null)
    }

    static loopMeshes( materials, entities, callback) {
        const l = entities.length
        for (let m = 0; m < l; m++) {
            const current = entities[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = RendererController.meshes.get(meshComponent.meshID)
            if (!mesh)
                continue
            const mat = materials[meshComponent.materialID]
            if (!mat || !mat.ready)
                continue
            callback(mat, mesh, meshComponent, current)
        }
        gpu.bindVertexArray(null)
    }
}