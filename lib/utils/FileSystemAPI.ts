import GPU from "../../GPU";
import GPUAPI from "../rendering/GPUAPI";
import MaterialInformation from "../../static/MaterialInformation";


export default class FileSystemAPI {
    static #callback
    static #fetchingMaterials: { [key: string]: Function[] } = {}
    static #fetchingMeshes: { [key: string]: Function[] } = {}
    static ASSETS_PATH

    static get isReady() {
        return FileSystemAPI.#callback != null
    }

    /*
    Param can be either a registryID or an absolute path to the asset itself
     */
    static async readAsset(assetID: string) {
        if (FileSystemAPI.#callback)
            return FileSystemAPI.#callback(assetID)
        return null
    }

    static async loadTexture(registryID: string) {
        if (GPU.textures.get(registryID) != null)
            return
        try {
            const textureData = await FileSystemAPI.readAsset(registryID)
            if (textureData)
                await GPUAPI.allocateTexture({
                    ...textureData,
                    img: textureData.base64,
                    yFlip: textureData.flipY
                }, registryID)
        } catch (err) {
            console.error(err)
        }
    }

    static async loadMesh(ID: string): Promise<boolean> {
        if (!ID || GPU.meshes.get(ID) != null) {
            FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMeshes, ID)
            return
        }
        if (FileSystemAPI.#fetchingMeshes[ID])
            return await new Promise(resolve => {
                FileSystemAPI.#fetchingMeshes[ID].push(resolve)
            })
        else {
            FileSystemAPI.#fetchingMeshes[ID] = []

            try {
                if (!GPU.meshes.get(ID)) {
                    const data = await FileSystemAPI.readAsset(ID)
                    if (!data) {
                        FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMeshes, ID)
                        return
                    }
                    const file = JSON.parse(data)
                    GPUAPI.allocateMesh(ID, file)
                    FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMeshes, ID)
                    return
                }
            } catch (err) {
                console.error(err)
            }
            FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMeshes, ID)
        }
    }

    static #doCallback(data: { [key: string]: Function[] }, id: string) {
        if (FileSystemAPI.#fetchingMaterials[id])
            data[id].forEach(cb => cb())
        console.log("RESOLVING")
        delete FileSystemAPI.#fetchingMaterials[id]
    }

    static async loadMaterial(ID: string) {
        if (!ID || GPU.materials.get(ID) != null) {
            FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMaterials, ID)
            return
        }
        if (FileSystemAPI.#fetchingMaterials[ID])
            return await new Promise(resolve => {

                FileSystemAPI.#fetchingMaterials[ID].push(resolve)
            })
        else {
            FileSystemAPI.#fetchingMaterials[ID] = []
            try {
                if (!GPU.materials.get(ID)) {
                    const data = await FileSystemAPI.readAsset(ID)
                    if (!data) {
                        FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMaterials, ID)
                        return
                    }
                    const file = JSON.parse(data)
                    if (!file?.response) {
                        FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMaterials, ID)
                        return
                    }
                    const materialInformation = file.response
                    if (materialInformation) {
                        await GPUAPI.allocateMaterial(<MaterialInformation>materialInformation, ID)
                        FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMaterials, ID)
                        return
                    }
                }
            } catch (err) {
                console.error(err)
            }
            FileSystemAPI.#doCallback(FileSystemAPI.#fetchingMaterials, ID)
        }
    }


    static initialize(cb: Function) {
        if (FileSystemAPI.isReady)
            return
        FileSystemAPI.#callback = cb
    }
}