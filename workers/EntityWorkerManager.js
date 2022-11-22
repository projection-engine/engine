import COMPONENTS from "../static/COMPONENTS";

export default class EntityWorkerManager {
    static movementWorker
    static instancingWorker
    static cullingWorker

    static initialize() {
        EntityWorkerManager.movementWorker = new Worker("./build/movement-worker.js")
        EntityWorkerManager.instancingWorker = new Worker("./build/instancing-worker.js")
        EntityWorkerManager.cullingWorker = new Worker("./build/culling-worker.js")
    }

    static updateEntityReference(entity) {
        const components = entity.components
        if (components.get(COMPONENTS.MESH))
            EntityWorkerManager.instancingWorker.postMessage("UPDATE",)
    }
}