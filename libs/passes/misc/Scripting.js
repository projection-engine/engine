import COMPONENTS from "../../../data/COMPONENTS"
import * as glMatrix from "gl-matrix"

import KEYS from "../../../data/KEYS"
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
                backdropFilter: "blur(10px) brightness(70%)", borderRadius: "5px", width: "fit-content",
                height: "fit-content", position: "absolute", bottom: "4px", left: "4px", zIndex: "10",
                color: "white", padding: "8px", fontSize: ".75rem",
                maxWidth: "15vw", display: "none",
                maxHeight: "50vh", overflow: "hidden"
            })
            window.gpu.canvas.parentNode.appendChild(this.renderTarget)
        }
    }

    execute(options, data, entities, entitiesMap, updateAllLights) {
        const {meshesMap, scripts} = data
        const {
            elapsed,
            camera
        } = options

        if (window.renderer.environment === ENVIRONMENT.PROD) {
            // this.renderTarget.style.display = "block"
            const size = scripts.length
            for (let i = 0; i < size; i++) {
                scripts[i].execute(entities, camera)
                // this.executeLoop(scripts[i], elapsed, entitiesMap, camera, meshesMap, entities, updateAllLights)
            }
        }
    }

    static parseScript(code) {
        console.log(code)
        const data = new Function(code)
        const systemRef = data()
        console.log(systemRef)
        systemRef.props = {
            KEYS,
            glMatrix,
            COMPONENTS,
        }
        if (systemRef?.constructor)
            systemRef.constructor()

        return systemRef
    }
}
