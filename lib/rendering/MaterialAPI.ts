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
import MutableObject from "../../static/MutableObject";
import MeshResourceMapper from "../MeshResourceMapper";

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