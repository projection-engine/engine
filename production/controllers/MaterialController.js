import Engine from "../Engine";
import COMPONENTS from "../data/COMPONENTS";
import GPU from "../GPU";
import AOPass from "../passes/AOPass";
import SpecularProbePass from "../passes/SpecularProbePass";
import DiffuseProbePass from "../passes/DiffuseProbePass";
import FALLBACK_MATERIAL from "../data/FALLBACK_MATERIAL";


export default class MaterialController {
    static draw(mesh, material) {
        if (material.settings.depthTest === false)
            gpu.disable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.disable(gpu.BLEND)

        mesh.draw()

        if (material.settings.depthTest === false)
            gpu.enable(gpu.DEPTH_TEST)
        if (material.settings.blend === false)
            gpu.enable(gpu.BLEND)
    }

    static getEnvironment(entity) {
        const specular = SpecularProbePass.probes[entity.id]
        const diffuse = DiffuseProbePass.probes[entity.id]

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
            sceneColor
        } = attributes

        if (!mesh || !material)
            return
        material.use(
            {
                ...ambient,
                projectionMatrix,
                transformMatrix,
                viewMatrix,
                normalMatrix,
                sceneColor,
                brdfSampler: GPU.BRDF,
                elapsedTime: elapsed,
                cameraVec: camPosition,
                directionalLightsData,
                directionalLightsQuantity,
                dirLightPOV,
                aoSampler: AOPass.filteredSampler,
                lightQuantity: pointLightsQuantity,
                pointLightData
            },
            useCubeMapShader
        )
        if (directDrawing)
            mesh.draw()
        else
            MaterialController.draw(mesh, material)
    }

    static drawProbe(view, projection, cubeMapPosition,) {
        const materials = GPU.materials
        const {
                meshes,
                directionalLightsData,
                dirLightPOV, pointLightsQuantity, pointLightData,
                maxTextures
            } = Engine.data,
            {elapsed} = Engine.params,
            l = meshes.length
        for (let m = 0; m < l; m++) {
            const current = meshes[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = GPU.meshes.get(meshComponent.meshID)

            if (mesh !== undefined) {
                let mat = materials.get(meshComponent.materialID)
                if (!mat || !mat.ready)
                    mat = GPU.materials.get(FALLBACK_MATERIAL)
                const ambient = MaterialController.getEnvironment(current)
                MaterialController.drawMesh({
                    ambient,
                    mesh,
                    camPosition: cubeMapPosition,
                    viewMatrix: view,
                    projectionMatrix: projection,
                    transformMatrix: current.transformationMatrix,
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

    static loopMeshes(entities, callback) {
        const l = entities.length
        const materials = GPU.materials
        const meshes = GPU.meshes

        for (let m = 0; m < l; m++) {
            const current = entities[m]
            if (!current.active)
                continue
            const meshComponent = current.components[COMPONENTS.MESH]
            const mesh = meshes.get(meshComponent.meshID)
            if (!mesh)
                continue
            const mat = materials.get(meshComponent.materialID)
            if (!mat || !mat.ready)
                continue
            callback(mat, mesh, meshComponent, current)
        }
        gpu.bindVertexArray(null)
    }
}