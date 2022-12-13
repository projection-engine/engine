import WORKER_MESSAGES from "../static/WORKER_MESSAGES.json"
import TransformationPass from "../runtime/misc/TransformationPass";

self.onmessage = (event) => {
    if (event.data) {
        const {type, payload} = event.data
        switch (type) {
            case WORKER_MESSAGES.INITIALIZE:
                TransformationPass.initialize(payload, self)
                break
            case WORKER_MESSAGES.REGISTER_ENTITY:
                TransformationPass.targets.push(payload)
                break
            case WORKER_MESSAGES.REMOVE_ENTITY:
                TransformationPass.targets = TransformationPass.targets.filter(e => e.id !== payload)
                break
            default:
                break
        }
    } else
        TransformationPass.execute()
}