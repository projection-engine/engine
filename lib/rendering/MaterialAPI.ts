import GPU from "../../GPU";
import DATA_TYPES from "../../static/DATA_TYPES";
import GPUAPI from "./GPUAPI";

import FileSystemAPI from "../utils/FileSystemAPI";
import Entity from "../../instances/Entity";
import Material from "../../instances/Material";
import MeshComponent from "../../instances/components/MeshComponent";
import MaterialUniform from "../../static/MaterialUniform";
import TextureParams from "../../static/TextureParams";
import TextureInUse from "../../static/TextureInUse";
import MutableObject from "../../MutableObject";

export default class MaterialAPI {
    static #generator?: Generator<number>

    static* #getIncrementalID() {
        let counter = 0
        while (true) {
            yield counter
            counter++
        }
    }

    static registerMaterial(material) {
        if (material.bindID > -1)
            return
        if (!MaterialAPI.#generator)
            MaterialAPI.#generator = MaterialAPI.#getIncrementalID()
        material.bindID = MaterialAPI.#generator.next().value
    }


    static updateMap(component: MeshComponent) {
        const entity = component?.entity

        if (!entity || !Entity.isRegistered(entity)) return;

        const meshID = component._meshID
        const materialID = component._materialID
        const referenceMat = GPU.materials.get(materialID)
        const possibleNewUniforms = referenceMat?.uniforms || []
        let hasToUpdate = false
        for (let i = 0; i < possibleNewUniforms.length; i++) {
            const current = component.materialUniforms[i]
            const currentTarget = possibleNewUniforms[i]
            hasToUpdate = hasToUpdate || !current || current && current.key !== currentTarget.key && current.type !== currentTarget.type
        }

        if (hasToUpdate)
            component.materialUniforms = JSON.parse(JSON.stringify(possibleNewUniforms))
        entity.materialRef = referenceMat
        if (!entity.materialRef) {
            component.overrideMaterialUniforms = false
            component.materialUniforms = []
        }
        if (referenceMat)
            MaterialAPI.mapUniforms(component.materialUniforms, component.__texturesInUse, component.__mappedUniforms).catch(err => console.error(err))
        if (!referenceMat && materialID != null)
            FileSystemAPI.loadMaterial(materialID)
                .then(res => {
                    if (res)
                        MaterialAPI.updateMap(component)
                    else
                        console.error("Material not found")
                })


        if (entity.meshRef?.id !== meshID && meshID) {
            entity.meshRef = GPU.meshes.get(component._meshID)
            if (!entity.meshRef)
                FileSystemAPI.loadMesh(component._meshID).then(res => {
                    if (res)
                        MaterialAPI.updateMap(component)
                    else
                        console.error("Mesh not found")
                })
        } else if (!meshID)
            entity.meshRef = undefined
    }

    static async updateMaterialUniforms(material: Material) {
        const data = material.uniforms
        if (!Array.isArray(data))
            return
        await MaterialAPI.mapUniforms(data, material.texturesInUse, material.uniformValues)
    }

    static async mapUniforms(data: MaterialUniform[], texturesInUse: TextureInUse, uniformValues: MutableObject) {
        if (!Array.isArray(data))
            return

        Object.keys(texturesInUse).forEach((key) => delete texturesInUse[key])
        Object.keys(uniformValues).forEach((key) => delete uniformValues[key])

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
                        uniformValues[currentUniform.key] = exists
                    } else {
                        const asset = await FileSystemAPI.readAsset(textureID)
                        if (asset) {
                            const textureData = <TextureParams>(typeof asset === "string" ? JSON.parse(asset) : asset)
                            const texture = await GPUAPI.allocateTexture({
                                ...textureData,
                                img: textureData.base64
                            }, textureID)

                            if (texture) {
                                texturesInUse[textureID] = {texture, key: currentUniform.key}
                                uniformValues[currentUniform.key] = texture
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