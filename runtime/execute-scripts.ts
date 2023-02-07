import ScriptsAPI from "../lib/utils/ScriptsAPI";
import MetricsController from "../lib/utils/MetricsController";
import METRICS_FLAGS from "../static/METRICS_FLAGS";

export default function executeScripts() {

    const scripts = ScriptsAPI.mountedScripts
    const size = scripts.length
    if (size === 0)
        return
    for (let i = 0; i < size; i++) {
        try {
            const script = scripts[i]
            if (script.onUpdate)
                script.onUpdate()
        } catch (err) {
            console.warn(err)
        }
    }
    MetricsController.currentState = METRICS_FLAGS.SCRIPT
}