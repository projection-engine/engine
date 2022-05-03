import System from "../basic/System";
import COMPONENTS from "../../templates/COMPONENTS";
import * as glMatrix from "gl-matrix";
import {KEYS} from "../../../pages/project/utils/hooks/useHotKeys";
import Transformation from "../../utils/Transformation";
import PickSystem from "./PickSystem";
import SYSTEMS from "../../templates/SYSTEMS";

export default class ScriptSystem extends System {
    pressedKeys = {}
    eventSet = false
    mousePosition = {x: 0, y: 0}

    constructor(gpu) {
        super([]);
        this.gpu = gpu
        this.id = gpu.canvas.id.replace('-canvas', '')
        const targetID = gpu.canvas.id.replace('-canvas', '-scripting')
        if (document.getElementById(targetID) !== null)
            this.renderTarget = document.getElementById(targetID)
        else {
            this.renderTarget = document.createElement('code')
            this.renderTarget.id = targetID
            Object.assign(this.renderTarget.style, {
                backdropFilter: "blur(10px) brightness(70%)", borderRadius: "5px", width: "fit-content",
                height: 'fit-content', position: 'absolute', bottom: '4px', left: '4px', zIndex: '10',
                color: 'white', padding: '8px', fontSize: '.75rem',
                maxWidth: '15vw', display: 'none',
                maxHeight: '50vh', overflow: 'hidden'
            });
            gpu.canvas.parentNode.appendChild(this.renderTarget)
        }

        document.addKey = (key) => {
            this.pressedKeys[key] = true
        }
        document.removeKey = (key) => {
            delete this.pressedKeys[key]
        }
        document.setMouse = (position) => {
            this.mousePosition = position
        }

    }

    execute(options, systems, data, entities, entitiesMap) {
        super.execute()
        const {
            scriptedEntities,
            scripts,
            meshSources
        } = data

        const {
            canExecutePhysicsAnimation,
            lockCamera,
            elapsed,
            camera
        } = options

        if (canExecutePhysicsAnimation) {
            if (!this.eventSet) {
                lockCamera(true)
                this.eventSet = true
                document.addEventListener('mouseup', handler)
                document.addEventListener('keydown', handler)
                document.addEventListener('keyup', handler)
                document.addEventListener('mousemove', handler)
                document.addEventListener('mousedown', handler)
            }

            this.renderTarget.style.display = 'block'
            const keys = Object.keys(scriptedEntities)
            for (let i = 0; i < keys.length; i++) {
                const embeddedScript = scripts[scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].registryID]
                if(embeddedScript)
                    this.executeLoop(embeddedScript.executor, elapsed, entitiesMap, camera, meshSources, systems[SYSTEMS.PICK], entities)
                else {
                    const entityScripts =  scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].scripts
                    for (let j = 0; j < entityScripts.length; j++) {
                        const currentS = scripts[entityScripts[j]]
                        if (currentS)
                            this.executeLoop(currentS.executor, elapsed, {[scriptedEntities[keys[i]].id]: scriptedEntities[keys[i]]}, camera, meshSources, systems[SYSTEMS.PICK], entities)
                    }
                }
            }
            // LEVEL BLUEPRINT
            if (scripts[this.id])
                this.executeLoop(scripts[this.id].executor, elapsed, entitiesMap, camera, meshSources, systems[SYSTEMS.PICK], entities)
        } else if (this.eventSet) {
            lockCamera(false)

            this.eventSet = false
            this.renderTarget.style.display = 'none'
            this.renderTarget.innerText = ''
            document.removeEventListener('mouseup', handler)
            document.removeEventListener('mousedown', handler)
            document.removeEventListener('keydown', handler)
            document.removeEventListener('keyup', handler)
            document.removeEventListener('mousemove', handler)
        }
    }

    executeLoop(executor, elapsed, entities, camera, meshSources, pickSystem, entitiesArr) {
        executor.execute({
            elapsed,
            entities,
            renderTarget: this.renderTarget,
            pressedKeys: this.pressedKeys,
            KEYS,
            mousePosition: this.mousePosition,
            camera,
            glMatrix,
            COMPONENTS,
            utils: {
                toEuler: Transformation.getEuler,
                pick: (entity, coords = this.mousePosition) => {
                    if (entity.components[COMPONENTS.MESH]) {
                        const index = pickSystem.pickElement((shader, proj) => {
                            const mesh = meshSources[entity.components[COMPONENTS.MESH]?.meshID]
                            PickSystem.drawMesh(mesh, entity, camera.viewMatrix, proj, entity.components[COMPONENTS.TRANSFORM].transformationMatrix, shader, this.gpu)
                        }, coords, camera)

                        return entitiesArr.find(e => e.components[COMPONENTS.PICK]?.pickID[0] * 255 === index)
                    }
                    return undefined
                }
            }
        })
    }

    static parseScript(code) {
        const className = code.name ? prepareName(code.name) : 'Script'
        const hasName = code.match(/class(\s+)(\w+)/gm)

        const body = `
            ${hasName !== null ? code : `class ${className} ${code}`}            
            return new ${hasName !== null ? hasName[0].replace('class', '') : className}()
        `;
        const executionLine = new Function('', body);
        return executionLine([])

    }
}

function prepareName(name) {

    const word = name.trim().replaceAll(/\s/g, "").replaceAll('-', '').replaceAll('_', '').replaceAll('.', '').replaceAll(',', '')
    return word[0].toUpperCase() + word.substring(1).toLowerCase();
}

function handler(event) {
    const addKey = event.currentTarget.addKey
    const removeKey = event.currentTarget.removeKey
    const setMouse = event.currentTarget.setMouse
    switch (event.type) {
        case 'keydown':
            addKey(event.code)
            break
        case 'keyup':
            removeKey(event.code)
            break
        case 'mousemove':
            setMouse({x: event.clientX, y: event.clientY})
            break
        case 'mousedown':
            addKey('Mouse' + event.button)
            break
        case 'mouseup':
            removeKey('Mouse' + event.button)
            break
        default:
            break
    }
}