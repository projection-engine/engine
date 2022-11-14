import Engine from "../../Engine";
import COMPONENTS from "../../static/COMPONENTS.js";
import GPU from "../../GPU";
import AmbientOcclusion from "../../runtime/occlusion/AmbientOcclusion";
import SpecularProbePass from "../../runtime/rendering/SpecularProbePass";
import DiffuseProbePass from "../../runtime/rendering/DiffuseProbePass";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import DATA_TYPES from "../../static/DATA_TYPES";
import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS";
import ImageWorker from "../../workers/image/ImageWorker";
import GPUAPI from "./GPUAPI";
import DirectionalShadows from "../../runtime/occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/occlusion/OmnidirectionalShadows";
import GBuffer from "../../runtime/rendering/GBuffer";
import FileSystemAPI from "../utils/FileSystemAPI";

const SKYBOX = MATERIAL_RENDERING_TYPES.SKYBOX
export default class MaterialAPI {
    static deferredShadedEntities = []
    static forwardShadedEntities = []
    static staticShadedEntities = []

    static materialEntityMap = new Map()
    static meshEntityMap = new Map()

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

    static #getEnvironment(id, meshComponent) {
        const result = []
        if (!meshComponent)
            return result
        if (meshComponent.diffuseProbeInfluence) {
            const diffuse = DiffuseProbePass.probes[id]
            if (diffuse) {
                result[2] = diffuse[0]?.texture
                result[3] = diffuse[1]?.texture
                result[4] = diffuse[2]?.texture
            }
        }

        if (meshComponent.specularProbeInfluence) {
            const specular = SpecularProbePass.probes[id]
            if (specular) {
                result[0] = specular?.texture
                result[1] = specular?.mipmaps
            }
        }
        return result
    }

    static drawMesh(id, mesh, material, meshComponent, uniforms, directDrawing = false) {
        const isNotSkybox = material.shadingType !== SKYBOX
        if (material.shadingType === MATERIAL_RENDERING_TYPES.FORWARD) {
            const ambient = MaterialAPI.#getEnvironment(id, meshComponent)
            uniforms.prefilteredMap = ambient[0]
            uniforms.ambientLODSamples = ambient[1]
            uniforms.irradiance0 = ambient[2]
        }

        uniforms.brdfSampler = GPU.BRDF
        uniforms.aoSampler = AmbientOcclusion.filteredSampler
        uniforms.elapsedTime = Engine.elapsed

        material.use(uniforms, uniforms.useCubeMapShader && isNotSkybox)

        if (directDrawing)
            mesh.draw()
        else
            MaterialAPI.draw(mesh, material)
    }

    static drawProbe(view, projection, cubeMapPosition,) {
        const {
            meshes,
            directionalLightsData,
            dirLightPOV, pointLightsQuantity, pointLightData,
            directionalLightsQuantity
        } = Engine.data

        MaterialAPI.loopMeshes(meshes, (mat, mesh, meshComponent, current) => {
            MaterialAPI.drawMesh(
                current.id,
                mesh,
                mat,
                meshComponent,
                {
                    settings: GBuffer.deferredUniforms.settings,
                    shadowMapTexture: DirectionalShadows.shadowMapShader,
                    shadowCube: OmnidirectionalShadows.shadowMap.texture,
                    transformMatrix: current.matrix,
                    materialComponent: meshComponent,
                    directionalLightsQuantity,
                    directionalLightsData,
                    dirLightPOV,
                    lightQuantity: pointLightsQuantity,
                    pointLightData,
                    useCubeMapShader: true
                })
        })
    }

    static loopMeshes(entities, callback) {
        const l = entities.length
        const materials = GPU.materials
        const meshes = GPU.meshes

        for (let m = 0; m < l; m++) {
            const current = entities[m]
            if (!current.active)
                continue
            const meshComponent = current.components.get(COMPONENTS.MESH)
            const mesh = meshes.get(meshComponent.meshID)
            const mat = materials.get(meshComponent.materialID)


            if (!mesh || !mat || !mat.ready)
                continue
            callback(mat, mesh, meshComponent, current)
        }
    }

    static loopTerrain(entities, callback) {
        const l = entities.length
        const materials = GPU.materials
        const meshes = GPU.meshes

        for (let m = 0; m < l; m++) {
            const current = entities[m]

            if (!current.active)
                continue
            const terrainComponent = current.components.get(COMPONENTS.TERRAIN)
            const mesh = meshes.get(terrainComponent.terrainID)
            const mat = materials.get(terrainComponent.materialID)

            if (!mesh || !mat || !mat.ready)
                continue
            callback(mat, mesh, terrainComponent, current)
        }
    }

    static async updateMaterialUniforms(data, material) {

        return await Promise.all(data.map(k => {
            return new Promise(async resolve => {
                switch (k.type) {
                    case DATA_TYPES.COLOR: {
                        const img = await ImageWorker.request(IMAGE_WORKER_ACTIONS.COLOR_TO_IMAGE, {
                            color: k.data,
                            resolution: 4
                        })
                        const textureID = k.data.toString()
                        let texture = await GPUAPI.allocateTexture(img, textureID)

                        material.texturesInUse[textureID] = texture
                        material.updateTexture[textureID] = (newTexture) => {
                            material.uniformData[k.key] = newTexture
                        }
                        material.uniformData[k.key] = texture.texture
                        break
                    }
                    case DATA_TYPES.TEXTURE: {
                        try {
                            if (FileSystemAPI.isReady) {
                                const textureID = k.data
                                if (!material.texturesInUse[textureID]) {
                                    const asset = await FileSystemAPI.readAsset(textureID)
                                    if (asset) {
                                        if (GPU.textures.get(textureID))
                                            GPUAPI.destroyTexture(textureID)
                                        const textureData = typeof asset === "string" ? JSON.parse(asset) : asset

                                        let texture = await GPUAPI.allocateTexture({
                                            ...textureData,
                                            img: textureData.base64,
                                            yFlip: textureData.flipY,
                                        }, textureID)

                                        if (texture) {
                                            material.texturesInUse[textureID] = texture
                                            material.updateTexture[textureID] = (newTexture) => {
                                                material.uniformData[k.key] = newTexture
                                            }
                                            material.uniformData[k.key] = texture.texture
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error(error)
                        }
                        break
                    }
                    default:
                        material.uniformData[k.key] = k.data
                        break
                }
                resolve()
            })
        }))
    }

}