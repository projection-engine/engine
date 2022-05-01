import System from "../basic/System";
import COMPONENTS from "../../templates/COMPONENTS";
import * as glMatrix from "gl-matrix";
import {KEYS} from "../../../pages/project/utils/hooks/useHotKeys";

export default class ScriptSystem extends System {
    pressedKeys = {}
    eventSet = false
    mousePosition = {x: 0, y: 0}

    constructor(gpu) {
        super([]);
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
            scripts
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
                const currentS = scripts[scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].registryID].executor
                this.executeLoop(currentS.executor, elapsed, entitiesMap, camera)

            }
            // LEVEL BLUEPRINT
            this.executeLoop(scripts[this.id].executor, elapsed, entitiesMap, camera)
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

    executeLoop(executor, elapsed, entities, camera) {
        executor.execute({
            elapsed,
            entities,
            renderTarget: this.renderTarget,
            pressedKeys: this.pressedKeys,
            KEYS,
            mousePosition: this.mousePosition,
            camera,
            glMatrix,
            COMPONENTS
        })
    }

    static parseScript(code, className = 'Script') {
        const body = `
            class ${className} ${code}            
           
            return new ${className}()
        `;
        const executionLine = new Function('', body);
        return executionLine([])

    }
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