import WORKER_MESSAGES from "../static/WORKER_MESSAGES.ts"
import TransformationPass from "../runtime/misc/TransformationPass";


self.onmessage = (event) => {
    if (event.data) {
        const {type, payload} = event.data
        switch (type) {
            case WORKER_MESSAGES.INITIALIZE:
                TransformationPass.initialize(payload)
                break
            case WORKER_MESSAGES.REGISTER_ENTITY:
                TransformationPass.targets.add(payload.id, payload)
                TransformationPass.updateThreadInfo()
                break
            case WORKER_MESSAGES.REMOVE_ENTITY:
                TransformationPass.targets.delete(payload)
                TransformationPass.updateThreadInfo()
                break
            default:
                break
        }
    } else
        TransformationPass.execute()
}