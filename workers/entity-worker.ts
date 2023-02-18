import WORKER_MESSAGES from "../static/WORKER_MESSAGES"
import TransformationPass from "../runtime/TransformationPass";


self.onmessage = (event) => {
    if (event.data) {
        const {type, payload} = event.data
        switch (type) {
            case WORKER_MESSAGES.INITIALIZE:
                TransformationPass.initialize(payload)
                break
            case WORKER_MESSAGES.REGISTER_ENTITY:
                if(TransformationPass.targets.has(payload.id))
                    TransformationPass.targets.delete(payload.id)
                TransformationPass.targets.set(payload.id, payload)
                TransformationPass.updateThreadInfo()
                break
            case WORKER_MESSAGES.REMOVE_ENTITY:
                TransformationPass.targets.delete(payload)
                TransformationPass.updateThreadInfo()
                break
            case WORKER_MESSAGES.REMOVE_ENTITY_BLOCK:

                TransformationPass.targets.removeBlock(payload, data => data)
                TransformationPass.updateThreadInfo()
                break

            case WORKER_MESSAGES.ADD_BLOCK:

                TransformationPass.targets.addBlock(payload, data => data.id)
                TransformationPass.updateThreadInfo()
                break
            default:
                break
        }
    } else
        TransformationPass.execute()
}