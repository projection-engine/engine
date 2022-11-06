import ScriptsAPI from "./ScriptsAPI";
import FALLBACK_MATERIAL from "../static/FALLBACK_MATERIAL";
import TERRAIN_MATERIAL from "../static/TERRAIN_MATERIAL";
import GPU from "../GPU";
import GPUAPI from "./GPUAPI";
import ConsoleAPI from "./ConsoleAPI";
import FILE_TYPES from "shared-resources/FILE_TYPES";

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

    static async loadMesh(ID){
        try{
            const file = JSON.parse(await FileSystemAPI.readAsset(ID))
            GPUAPI.allocateMesh(ID, file)
        }catch (err){
            console.error(err)
            ConsoleAPI.error(err)
        }
    }

    static async loadMaterial(ID) {
        if (ID === FALLBACK_MATERIAL || !ID || ID.includes(TERRAIN_MATERIAL) || GPU.materials.get(ID) != null)
            return GPU.materials.get(ID) != null
        try {
            if (!GPU.materials.get(ID)) {
                const file = JSON.parse(await FileSystemAPI.readAsset(ID))
                const isInstance = file.original != null
                if (!file || !isInstance && !file.response)
                    return
                if (isInstance) {
                    if (!GPU.materials.get(file.original))
                        await FileSystemAPI.loadMaterial(file.original)
                    await GPUAPI.allocateMaterialInstance(file, ID)
                } else
                    await new Promise(resolve => {
                        GPUAPI.allocateMaterial({
                            onCompiled: () => resolve(),
                            settings: file.response.settings,
                            vertex: file.response.vertexShader,
                            fragment: file.response.shader,
                            uniformData: file.response.uniformData
                        }, ID)
                    })
            }
            return true
        } catch (err) {
            console.error(err)
            ConsoleAPI.error(err)
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
                case FILE_TYPES.MATERIAL_INSTANCE:
                case FILE_TYPES.MATERIAL:
                case FILE_TYPES.TERRAIN:
                case FILE_TYPES.TERRAIN_MATERIAL:
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