import Engine from "../../Engine";
import GPU from "../../GPU";
import DATA_TYPES from "../../static/DATA_TYPES";
import GPUAPI from "./GPUAPI";

import FileSystemAPI from "../utils/FileSystemAPI";
import ConsoleAPI from "../utils/ConsoleAPI";
import Entity from "../../instances/Entity";

export default class MaterialAPI {
    static #incrementalMap = new Map()
    static entityMaterial = new Map()

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
        console.trace(component)
        if (component && Entity.isRegistered(component.__entity)) return;

        const referenceMat = GPU.materials.get(component._materialID)
        const referenceMesh = GPU.meshes.get(component._meshID)
        component.__entity.__meshID = component._meshID
        component.__entity.__materialID = component._materialID
        const possibleNewUniforms = referenceMat?.uniforms || []
        let hasToUpdate = false
        for (let i = 0; i < possibleNewUniforms.length; i++) {
            const current = component.materialUniforms[i]
            const currentTarget = possibleNewUniforms[i]
            hasToUpdate = hasToUpdate || !current || current && current.key !== currentTarget.key && current.type !== currentTarget.type
        }

        if (hasToUpdate)
            component.materialUniforms = JSON.parse(JSON.stringify(possibleNewUniforms))

        component.__entity.__meshRef = referenceMesh
        component.__entity.__materialRef = referenceMat
        console.trace(referenceMesh, referenceMat)
        if (referenceMat)
            MaterialAPI.mapUniforms(component.materialUniforms, component.__texturesInUse, component.__mappedUniforms).catch(err => console.error(err))

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
        await MaterialAPI.mapUniforms(data, material.texturesInUse, material.uniformValues)
    }

    static async mapUniforms(data, texturesInUse, uniformValues) {
        if (!Array.isArray(data))
            return
        for (let i = 0; i < data.length; i++) {
            const currentUniform = data[i]
            if (currentUniform.type === DATA_TYPES.TEXTURE) {
                const textureID = currentUniform.data
                if (texturesInUse[textureID] || !FileSystemAPI.isReady)
                    continue
                try {
                    const exists = GPU.textures.get(textureID)
                    if (exists) {
                        texturesInUse[textureID] = {texture: exists, key: currentUniform.key}
                        uniformValues[currentUniform.key] = exists.texture
                    } else {
                        const asset = await FileSystemAPI.readAsset(textureID)
                        if (asset) {
                            const textureData = GPU.textures.get(textureID) || typeof asset === "string" ? JSON.parse(asset) : asset
                            let texture = await GPUAPI.allocateTexture({
                                ...textureData,
                                img: textureData.base64,
                                yFlip: textureData.flipY,
                            }, textureID)

                            if (texture) {
                                texturesInUse[textureID] = {texture, key: currentUniform.key}
                                uniformValues[currentUniform.key] = texture.texture
                            }
                        }
                    }
                } catch (error) {
                    console.error(error)
                }
            } else
                uniformValues[currentUniform.key] = currentUniform.data
        }
    }

}