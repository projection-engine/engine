import Engine from "../../Engine";
import COMPONENTS from "../../static/COMPONENTS.js";
import GPU from "../../GPU";
import AmbientOcclusion from "../../runtime/occlusion/AmbientOcclusion";
import SpecularProbePass from "../../runtime/rendering/SpecularProbePass";
import DiffuseProbePass from "../../runtime/rendering/DiffuseProbePass";
import MATERIAL_RENDERING_TYPES from "../../static/MATERIAL_RENDERING_TYPES";
import DATA_TYPES from "../../static/DATA_TYPES";
import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS";
import ImageProcessor from "../math/ImageProcessor";
import GPUAPI from "./GPUAPI";
import DirectionalShadows from "../../runtime/occlusion/DirectionalShadows";
import OmnidirectionalShadows from "../../runtime/occlusion/OmnidirectionalShadows";
import GBuffer from "../../runtime/rendering/GBuffer";
import FileSystemAPI from "../utils/FileSystemAPI";
import ConsoleAPI from "../utils/ConsoleAPI";
import MeshComponent from "../../templates/components/MeshComponent";

export default class MaterialAPI {
    static deferredShadedEntities = []
    static forwardShadedEntities = []
    static staticShadedEntities = []

    static materialEntityMap = new Map()
    static meshEntityMap = new Map()

    static #incrementalMap = new Map()

    static* #getIncrementalID() {
        let counter = 1
        while (true) {
            yield counter
            counter++
        }
    }

    static #generator

    static registerMaterial(material) {
        if (MaterialAPI.#incrementalMap.get(material.id) != null)
            return
        if (!MaterialAPI.#generator)
            MaterialAPI.#generator = MaterialAPI.#getIncrementalID()
        material.bindID = MaterialAPI.#generator.next().value
        MaterialAPI.#incrementalMap.set(material.id, material.bindID)
    }

    static removeMaterial(matID) {
        MaterialAPI.#incrementalMap.delete(matID)
    }

    static updateMap(component) {
        if (!Engine.queryMap.get(component.__entity.queryKey))
            return;
        const referenceMat = GPU.materials.get(component._materialID)
        const referenceMesh = GPU.meshes.get(component._meshID)

        if (referenceMat && referenceMesh) {
            if (component.__mapSource.material === referenceMat && component.__mapSource.mesh === referenceMesh)
                return
            if (typeof component.__mapSource.index !== "number" || !MaterialAPI[component.__mapSource.type]?.[component.__mapSource.index]) {
                let key
                switch (referenceMat.shadingType) {
                    case MATERIAL_RENDERING_TYPES.DEFERRED:
                        key = "deferredShadedEntities"
                        break
                    case MATERIAL_RENDERING_TYPES.FORWARD:
                    case MATERIAL_RENDERING_TYPES.UNLIT:
                        key = "forwardShadedEntities"
                        break
                    case MATERIAL_RENDERING_TYPES.SKYBOX:
                        key = "staticShadedEntities"
                        break
                }
                component.__mapSource.type = key
                MaterialAPI[key].push({
                    entity: component.__entity,
                    component: component,
                    mesh: referenceMesh,
                    material: referenceMat
                })
                component.__mapSource.index = MaterialAPI[key].length - 1
            } else {
                const current = MaterialAPI[component.__mapSource.type][component.__mapSource.index]
                current.material = referenceMat
                current.mesh = referenceMesh

            }
        }
        if (!referenceMat && component._materialID != null) {
            FileSystemAPI.loadMaterial(component._materialID).then(res => {
                if (res)
                    MaterialAPI.updateMap(component)
                else
                    ConsoleAPI.error("Material not found")
            })
        }
        if (!referenceMesh && component._meshID != null) {
            FileSystemAPI.loadMesh(component._meshID).then(res => {
                if (res)
                    MaterialAPI.updateMap(component)
                else
                    ConsoleAPI.error("Mesh not found")
            })
        }
    }


    static async updateMaterialUniforms(data, material) {
        return await Promise.all(data.map(k => {
            return new Promise(async resolve => {
                switch (k.type) {
                    case DATA_TYPES.COLOR: {
                        const img = await ImageProcessor.request(
                            IMAGE_WORKER_ACTIONS.COLOR_TO_IMAGE,
                            {
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