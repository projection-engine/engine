import Engine from "../../Engine";
import ScriptsAPI from "../../lib/rendering/ScriptsAPI";

export default function executeScripts() {
    const scripts = ScriptsAPI.mountedScripts
    const size = scripts.length
    if (size === 0)
        return
    for (let i = 0; i < size; i++) {
        try {
            const script = scripts[i]
            if (script.onUpdate)
                script.onUpdate(Engine.params)
        } catch (err) {
            console.warn(err)
        }
    }
}