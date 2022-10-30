import Engine from "../Engine";

export default class ScriptingPass {

    static entitiesToExecute = []
    static execute() {
        const entities = ScriptingPass.entitiesToExecute
        const size = entities.length
        if(size === 0)
            return
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
