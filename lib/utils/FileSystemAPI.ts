import ScriptsAPI from "./ScriptsAPI";
import GPU from "../../GPU";
import GPUAPI from "../rendering/GPUAPI";
import FILE_TYPES from "../../../static/objects/FILE_TYPES";


export default class FileSystemAPI {
    static #callback
    static #callbackMetadata

    static get isReady() {
        return FileSystemAPI.#callback != null
    }

    static async readAsset(assetID) {
        if (FileSystemAPI.#callback)
            return FileSystemAPI.#callback(assetID)
        return null
    }

    static async loadMesh(ID:string):Promise<boolean> {
        try {
            const file = JSON.parse(await FileSystemAPI.readAsset(ID))
            GPUAPI.allocateMesh(ID, file)
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }

    static async loadMaterial(ID) {
        if (!ID || GPU.materials.get(ID) != null)
            return GPU.materials.get(ID) != null
        try {
            if (!GPU.materials.get(ID)) {
                const data = await FileSystemAPI.readAsset(ID)
                if (!data)
                    return false
                const file = JSON.parse(data)
                if (!file?.response)
                    return
                const materialInformation = file.response
                await GPUAPI.allocateMaterial(materialInformation, ID)

                return true
            }
        } catch (err) {
            console.error(err)
            console.error(err)
        }
        return false
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