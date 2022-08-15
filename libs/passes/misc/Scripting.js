import ENVIRONMENT from "../../../data/ENVIRONMENT"
import Renderer from "../../../Renderer";


export default class Scripting {
    pressedKeys = {}

    execute(options, data, entities) {
        const {camera} = options

        if (Renderer.environment === ENVIRONMENT.DEV)
            return
        const size = entities.length
        for (let i = 0; i < size; i++) {
            const scripts = entities[i].scripts
            const scriptsSize = scripts.length
            for (let j = 0; j < scriptsSize; j++) {
                if (scripts[j].onUpdate)
                    scripts[j].onUpdate(camera)
            }
        }
    }

}
