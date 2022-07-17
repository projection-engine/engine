import COMPONENTS from "../../data/COMPONENTS"
import * as glMatrix from "gl-matrix"

import Transformation from "../../utils/Transformation"
import Picking from "./Picking"

import KEYS from "../../data/KEYS"
import ENVIRONMENT from "../../data/ENVIRONMENT"

export default class Scripting{
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
        const {meshesMap, levelScript} = data
        const {
            elapsed,
            camera
        } = options

        if (window.renderer.environment === ENVIRONMENT.PROD) {
            this.renderTarget.style.display = "block"
            const eLength= entities.length
            for (let i = 0; i < eLength; i++) {
                const scripts =  entities[i].scripts
                const sLength = scripts.length
                for(let s = 0; s < sLength; s++){
                    this.executeLoop(scripts[s], elapsed, entitiesMap, camera, meshesMap,  entities, updateAllLights)
                }
            }

            if (levelScript)
                this.executeLoop(levelScript, elapsed, entitiesMap, camera, meshesMap,  entities, updateAllLights)
        }
    }

    executeLoop(executor, elapsed, entities, camera, meshesMap, entitiesArr, updateAllLights) {

        executor.execute({
            elapsed,
            entities,
            renderTarget: this.renderTarget,
            pressedKeys: this.pressedKeys,
            KEYS,
            camera,
            glMatrix,
            COMPONENTS,
            utils: {
                toEuler: Transformation.getEuler,
                pick: (entity, coords) => {
                    if (entity.components[COMPONENTS.MESH]) {
                        const index = window.renderer.picking.pickElement((shader, proj) => {
                            const mesh = meshesMap.get(entity.components[COMPONENTS.MESH]?.meshID)
                            Picking.drawMesh(mesh, entity, camera.viewMatrix, proj, entity.components[COMPONENTS.TRANSFORM].transformationMatrix, shader)
                        }, coords, camera)

                        return entitiesArr.find(e => e.components[COMPONENTS.PICK]?.pickID[0] * 255 === index)
                    }
                    return undefined
                },
                updateAllLights
            }
        })
    }

    static parseScript(code) {
        const className = code.name ? prepareName(code.name) : "Script"
        const hasName = code.match(/class(\s+)(\w+)/gm)

        const body = `
            ${hasName !== null ? code : `class ${className} ${code}`}            
            return new ${hasName !== null ? hasName[0].replace("class", "") : className}()
        `
        const executionLine = new Function("", body)
        return executionLine([])

    }
}

function prepareName(name) {
    const word = name.trim().replaceAll(/\s/g, "").replaceAll("-", "").replaceAll("_", "").replaceAll(".", "").replaceAll(",", "")
    return word[0].toUpperCase() + word.substring(1).toLowerCase()
}
