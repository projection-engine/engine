import WORKER_MESSAGES from "./workers/WORKER_MESSAGES.json"
import {MovementPass} from "./workers/MovementPass";

/**
 * @field controlBuffers {Uint8Array [hasUpdatedItem]} - Transferred array from WorkerController, will be written to in case of changes to linked entities.
 */



self.onmessage = (event) => {
    const {type, payload} =event.data
    switch (type){
        case WORKER_MESSAGES.INITIALIZE:
            MovementPass.initialize(payload.buffer, self, payload.simulationFramerate)
            break
        case WORKER_MESSAGES.REGISTER_ENTITY:
            MovementPass.targets.push(payload)
            break
        case WORKER_MESSAGES.REMOVE_ENTITY:
            MovementPass.targets = MovementPass.targets.filter(e => e.id !== payload)
            break
        default:
            break
    }
}