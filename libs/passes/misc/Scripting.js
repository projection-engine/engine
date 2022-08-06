import ENVIRONMENT from "../../../data/ENVIRONMENT"


export default class Scripting {
    pressedKeys = {}

    constructor() {
        const targetID = window.gpu.canvas.id + "-scripting"
        if (document.getElementById(targetID) !== null)
            this.renderTarget = document.getElementById(targetID)
        else {
            this.renderTarget = document.createElement("code")
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, {
                width: "100vw",
                height: "100vh",
                position: 'absolute',
                zIndex: "-1"
            })
            window.gpu.canvas.parentNode.appendChild(this.renderTarget)
        }
    }

    execute(options, data, entities, entitiesMap, updateAllLights) {
        const {camera} = options
        if (window.renderer.environment === ENVIRONMENT.PROD) {
            const size = entities.length
            for (let i = 0; i < size; i++) {
                const scripts = entities[i].scripts
                const scriptsSize = scripts.length
                for (let j = 0; j < scriptsSize; j++)
                    scripts[j].onUpdate(camera, updateAllLights)
            }
        }
    }
}
