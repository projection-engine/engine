import ScriptsAPI from "./ScriptsAPI";
import GPU from "../../GPU";
import GPUAPI from "../rendering/GPUAPI";
import FILE_TYPES from "../../../static/objects/FILE_TYPES";
import MaterialInformation from "../../static/MaterialInformation";


export default class FileSystemAPI {
    static #callback
    static #callbackMetadata
    static #fetchingMaterials: { [key: string]: Function[] } = {}
    static #fetchingMeshes: { [key: string]: Function[] } = {}

    static get isReady() {
        return FileSystemAPI.#callback != null
    }

    static async readAsset(assetID) {
        if (FileSystemAPI.#callback)
            return FileSystemAPI.#callback(assetID)
        return null
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

    static async importAsset(ID) {
        const data = await FileSystemAPI.readAsset(ID)
        const metadata = FileSystemAPI.#callbackMetadata(ID)
        if (!metadata || !data)
            return null
        try {
            switch (metadata.type) {
                case FILE_TYPES.COLLECTION:

                case FILE_TYPES.MATERIAL:
                case FILE_TYPES.TERRAIN:

                case FILE_TYPES.PRIMITIVE:
                case FILE_TYPES.TEXTURE:
                case FILE_TYPES.LEVEL:
                case "json":
                    return JSON.parse(data)
                case FILE_TYPES.COMPONENT:
                case "js":
                    return ScriptsAPI.parseScript(data)
                default:
                    return data
            }
        } catch (err) {
            return null
        }
    }

    static initialize(cb, cbMetadata) {
        if (FileSystemAPI.#callback)
            return
        FileSystemAPI.#callbackMetadata = cbMetadata
        FileSystemAPI.#callback = cb
    }
}