import GPU from "../GPU";
import GPUAPI from "../lib/rendering/GPUAPI";
import MeshResourceMapper from "../lib/MeshResourceMapper";

const THRESHOLD = 120000
const INTERVAL = 120000
export default class ResourceManager {
    static #interval = null

    static start() {
        clearInterval(ResourceManager.#interval)
        ResourceManager.#interval = setInterval(ResourceManager.execute, INTERVAL)
    }

    static stop() {
        clearInterval(ResourceManager.#interval)
        ResourceManager.#interval = null
    }

    static execute() {
        console.log("EXECUTING")
        const meshes = GPU.meshes.array
        for (let i = 0; i < meshes.length; i++) {
            const current = meshes[i]
            const inUse = MeshResourceMapper.inUse.get(current.id)
            if (!inUse)
                GPUAPI.destroyMesh(current)
        }
    }
}
