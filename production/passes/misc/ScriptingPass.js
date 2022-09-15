import ENVIRONMENT from "../../../static/ENVIRONMENT"
import Engine from "../../Engine";
import UIAPI from "../../apis/utils/UIAPI";


const DEV = ENVIRONMENT.DEV
let entities
export default class ScriptingPass {
    static execute() {

        if (Engine.environment === DEV) {
            entities = undefined
            return
        }

        if (!entities)
            entities = [...Engine.entities, ...Array.from(UIAPI.entities.values())]
        const size = entities.length
        for (let i = 0; i < size; i++) {
            const scripts = entities[i].scripts
            const scriptsSize = scripts.length
            for (let j = 0; j < scriptsSize; j++) {
                if (scripts[j].onUpdate)
                    scripts[j].onUpdate(Engine.params)
            }
        }
    }
}
