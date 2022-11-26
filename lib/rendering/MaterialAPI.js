import Engine from "../../Engine";
import GPU from "../../GPU";
import DATA_TYPES from "../../static/DATA_TYPES";
import IMAGE_WORKER_ACTIONS from "../../static/IMAGE_WORKER_ACTIONS";
import ImageProcessor from "../math/ImageProcessor";
import GPUAPI from "./GPUAPI";

import FileSystemAPI from "../utils/FileSystemAPI";
import ConsoleAPI from "../utils/ConsoleAPI";

export default class MaterialAPI {
    static staticShadedEntities = []
    static #incrementalMap = new Map()

    static* #getIncrementalID() {
        let counter = 0
        while (true) {
            yield counter
            counter++
        }
    }

    static #generator

    static registerMaterial(material) {
        if (material.bindID > -1)
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
        component.__entity.__meshID = component._meshID
        component.__entity.__materialID = component._materialID
        component.materialUniforms = referenceMat?.uniforms || []
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


    static async updateMaterialUniforms(material) {
        const data = material.uniforms
        if (!Array.isArray(data))
            return
        for (let i = 0; i < data.length; i++) {
            const k = data[i]
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

                    material.texturesInUse[textureID] = {texture, key: k.key}
                    material.uniformValues[k.key] = texture.texture
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
                                        material.texturesInUse[textureID] = {texture, key: k.key}

                                        material.uniformValues[k.key] = texture.texture
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
                    material.uniformValues[k.key] = k.data
                    break
            }
        }
    }

}