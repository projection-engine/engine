import ENVIRONMENT from "../../../data/ENVIRONMENT"
import RendererController from "../../../RendererController";
import UserInterfaceController from "../../../UserInterfaceController";


const DEV = ENVIRONMENT.DEV
let entities
export default class ScriptingPass {
    execute() {

        if (RendererController.environment === DEV) {
            entities = undefined
            return
        }

        if (!entities)
            entities = [...Array.from(RendererController.entitiesMap.values()), ...Array.from(UserInterfaceController.entities.values())]
        const size = entities.length
        for (let i = 0; i < size; i++) {
            const scripts = entities[i].scripts
            const scriptsSize = scripts.length
            for (let j = 0; j < scriptsSize; j++) {
                if (scripts[j].onUpdate)
                    scripts[j].onUpdate(RendererController.params)
            }
        }
    }
}
