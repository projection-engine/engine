import EngineLoop from "../libs/loop/EngineLoop";
import Renderer from "../Renderer";
import COMPONENTS from "../data/COMPONENTS";


export default class MaterialRenderer {
    static draw(mesh, material) {
        const gpu = window.gpu
        // if (material.settings.faceCulling === false)
        //     gpu.disable(gpu.CULL_FACE)
        // else {
        //     gpu.enable(gpu.CULL_FACE)
        //     if(material.settings.cullBackFace)
        //         gpu.cullFace(gpu.BACK)
        //     else
        //         gpu.cullFace(gpu.FRONT)
        // }
        if (material.settings.depthMask === false)
            gpu.depthMask(false)
        if (material.settings.depthTest === false)
            gpu.disable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.disable(gpu.BLEND)

        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)

        if (material.settings.depthMask === false)
            gpu.depthMask(true)
        if (material.settings.depthTest === false)
            gpu.enable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.enable(gpu.BLEND)

    }

    static getEnvironment(entity) {
        const renderMap = EngineLoop.renderMap
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

    static drawMesh({
                        useCubeMapShader,
                        mesh,
                        camPosition,
                        viewMatrix,
                        projectionMatrix,
                        transformMatrix,
                        material,
                        normalMatrix,
                        materialComponent,

                        directionalLightsQuantity,
                        directionalLightsData,
                        dirLightPOV,
                        pointLightsQuantity,
                        pointLightData,
                        elapsed,
                        ambient,
                        sceneColor,
                        lastMaterial,
                        ao,

                        onlyForward
                    }, directDrawing = false) {
        if (!mesh || !material)
            return
        mesh.use()
        material.use(
            lastMaterial !== material.id,
            {
                ...ambient,
                projectionMatrix,
                transformMatrix,
                viewMatrix,
                normalMatrix,
                sceneColor,
                brdfSampler: Renderer.BRDF,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                directionalLightsData,
                directionalLightsQuantity,
                dirLightPOV,
                aoSampler: ao,
                lightQuantity: pointLightsQuantity,
                pointLightData,
                ...(materialComponent.overrideMaterial ? materialComponent.uniformValues : {})
            },
            useCubeMapShader
        )
        if (directDrawing) {
            const gpu = window.gpu
            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        }
        else
            MaterialRenderer.draw(mesh, material)
    }

    static drawProbe({
                         view,
                         projection,
                         cubeMapPosition,
                         data,
                         options,
                     }) {

        const {
                meshes, materials, meshesMap, directionalLightsData,
                dirLightPOV, pointLightsQuantity, pointLightData,
                maxTextures
            } = data,
            {elapsed} = options,
            l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = meshesMap.get(meshComponent.meshID)

            if (mesh !== undefined) {
                const currentMaterial = materials[meshComponent.materialID]
                let mat = currentMaterial && currentMaterial.ready ? currentMaterial : Renderer.fallbackMaterial
                if (!mat || !mat.ready)
                    mat = Renderer.fallbackMaterial
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
        window.gpu.bindVertexArray(null)

    }

    static loopMeshes(meshes, materials, entities, callback) {
        const l = entities.length
        for (let m = 0; m < l; m++) {
            const current = entities[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = meshes.get(meshComponent.meshID)
            if (!mesh)
                continue
            const mat = materials[meshComponent.materialID]
            if (!mat || !mat.ready)
                continue
            callback(mat, mesh, meshComponent, current)
        }
        window.gpu.bindVertexArray(null)
    }
}