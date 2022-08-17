import ENVIRONMENT from "../../../data/ENVIRONMENT"
import Renderer from "../../../Renderer";
import UIRenderer from "../../../UIRenderer";


const DEV = ENVIRONMENT.DEV
let entities
export default class Scripting {
    execute() {

        if (Renderer.environment === DEV) {
            entities = undefined
            return
        }

        if (!entities)
            entities = [...Array.from(Renderer.entitiesMap.values()), ...Array.from(UIRenderer.entities.values())]
        const size = entities.length
        for (let i = 0; i < size; i++) {
            const scripts = entities[i].scripts
            const scriptsSize = scripts.length
            for (let j = 0; j < scriptsSize; j++) {
                if (scripts[j].onUpdate)
                    scripts[j].onUpdate(Renderer.params)
            }
        }
    }
}
