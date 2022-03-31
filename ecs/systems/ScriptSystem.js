import System from "../basic/System";
import EventTick from "../../../../views/blueprint/nodes/events/EventTick";
import GetWorldRotation from "../../../../views/blueprint/nodes/transformation/GetWorldRotation";
import GetWorldTranslation from "../../../../views/blueprint/nodes/transformation/GetWorldTranslation";
import SetWorldRotation from "../../../../views/blueprint/nodes/transformation/SetWorldRotation";
import SetWorldTranslation from "../../../../views/blueprint/nodes/transformation/SetWorldTranslation";
import QuaternionToEuler from "../../../../views/blueprint/nodes/transformation/QuaternionToEuler";
import COMPONENTS from "../../templates/COMPONENTS";
import Getter from "../../../../views/blueprint/nodes/utils/Getter";
import Setter from "../../../../views/blueprint/nodes/utils/Setter";

import Subtract from "../../../../views/blueprint/nodes/operators/math/Subtract";
import Divide from "../../../../views/blueprint/nodes/operators/math/Divide";
import Add from "../../../../views/blueprint/nodes/operators/math/Add";
import Multiply from "../../../../views/blueprint/nodes/operators/math/Multiply";
import SetTransformationRelativeOrigin
    from "../../../../views/blueprint/nodes/transformation/SetTransformationRelativeOrigin";
import SetLocalRotation from "../../../../views/blueprint/nodes/transformation/SetLocalRotation";
import ToVector from "../../../../views/blueprint/nodes/operators/conversions/ToVector";
import FromVector from "../../../../views/blueprint/nodes/operators/conversions/FromVector";
import Print from "../../../../views/blueprint/nodes/utils/Print";
import And from "../../../../views/blueprint/nodes/operators/boolean/And";
import Branch from "../../../../views/blueprint/nodes/operators/boolean/Branch";
import Equal from "../../../../views/blueprint/nodes/operators/boolean/Equal";
import Greater from "../../../../views/blueprint/nodes/operators/boolean/Greater";
import GreaterEqual from "../../../../views/blueprint/nodes/operators/boolean/GreaterEqual";
import Less from "../../../../views/blueprint/nodes/operators/boolean/Less";
import LessEqual from "../../../../views/blueprint/nodes/operators/boolean/LessEqual";
import Nand from "../../../../views/blueprint/nodes/operators/boolean/Nand";
import Nor from "../../../../views/blueprint/nodes/operators/boolean/Nor";
import Not from "../../../../views/blueprint/nodes/operators/boolean/Not";
import NotEqual from "../../../../views/blueprint/nodes/operators/boolean/NotEqual";
import Or from "../../../../views/blueprint/nodes/operators/boolean/Or";
import Xor from "../../../../views/blueprint/nodes/operators/boolean/Xor";
import RandomInt from "../../../../views/blueprint/nodes/utils/RandomInt";
import RandomFloat from "../../../../views/blueprint/nodes/utils/RandomFloat";
import MouseX from "../../../../views/blueprint/nodes/events/MouseX";
import MouseY from "../../../../views/blueprint/nodes/events/MouseY";
import MousePosition from "../../../../views/blueprint/nodes/events/MousePosition";
import EntityReference from "../../../../views/blueprint/nodes/events/EntityReference";


export default class ScriptSystem extends System {
    pressedKeys = {}
    eventSet = false
    currentMousePosition = {x: 0, y: 0}
    constructor(gpu) {
        super([]);


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
                maxWidth: '15vw',
                maxHeight: '50vh',overflow: 'hidden'
            });
            gpu.canvas.parentNode.appendChild(this.renderTarget)
        }

        this.executors = {
            [EventTick.name]: EventTick.compile,
            [GetWorldRotation.name]: GetWorldRotation.compile,
            [GetWorldTranslation.name]: GetWorldTranslation.compile,
            [SetWorldRotation.name]: SetWorldRotation.compile,
            [SetWorldTranslation.name]: SetWorldTranslation.compile,
            [QuaternionToEuler.name]: QuaternionToEuler.compile,
            [Getter.name]: Getter.compile,
            [Setter.name]: Setter.compile,
            [Add.name]: Add.compile,
            [Subtract.name]: Subtract.compile,
            [Divide.name]: Divide.compile,
            [Multiply.name]: Multiply.compile,
            [SetTransformationRelativeOrigin.name]: SetTransformationRelativeOrigin.compile,
            [SetLocalRotation.name]: SetLocalRotation.compile,
            [ToVector.name]: ToVector.compile,
            [FromVector.name]: FromVector.compile,
            [Print.name]: Print.compile,
            [And.name]: And.compile,
            [Branch.name]: Branch.compile,
            [Equal.name]: Equal.compile,
            [Greater.name]: Greater.compile,
            [GreaterEqual.name]: GreaterEqual.compile,
            [Less.name]: Less.compile,
            [LessEqual.name]: LessEqual.compile,
            [Nand.name]: Nand.compile,
            [Nor.name]: Nor.compile,
            [Not.name]: Not.compile,
            [NotEqual.name]: NotEqual.compile,
            [Or.name]: Or.compile,
            [Xor.name]: Xor.compile,
            [RandomInt.name]: RandomInt.compile,
            [RandomFloat.name]: RandomFloat.compile,
            [MouseX.name]: MouseX.compile,
            [MouseY.name]: MouseY.compile,
            [MousePosition.name]: MousePosition.compile,
            [EntityReference.name]: EntityReference.compile,
        }
        document.addKey = (key) => {
            this.pressedKeys[key] = true
        }
        document.removeKey = (key) => {
            delete this.pressedKeys[key]
        }
        document.setMouse = (position) => {
            this.currentMousePosition = position
        }

    }

    execute(options, systems, data, entities) {
        super.execute()
        const {
            scriptedEntities,
            scripts
        } = data

        const {
            canExecutePhysicsAnimation,
            lockCamera,
            elapsed
        } = options

        if (canExecutePhysicsAnimation) {
            if(!this.eventSet) {
                lockCamera(true)
                this.eventSet = true
                document.addEventListener('keydown', handler)
                document.addEventListener('keyup', handler)
                document.addEventListener('mousemove', handler)
            }

            this.renderTarget.style.display = 'block'
            const keys = Object.keys(scriptedEntities)


            for (let i = 0; i < keys.length; i++) {
                const currentS = scripts[scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].registryID].executors

                for(let j = 0; j < currentS?.length; j++){
                    if (currentS[j]) {
                        let order = currentS[j].order
                        this.executeLoop(order, {}, elapsed, scriptedEntities, keys, entities, i, currentS[j])
                    }
                }
            }
        } else if(this.eventSet){
            lockCamera(false)
            this.eventSet = false
            this.renderTarget.style.display = 'none'
            this.renderTarget.innerText = ''
            document.removeEventListener('keydown', handler)
            document.removeEventListener('keyup', handler)
            document.removeEventListener('mousemove', handler)
        }
    }

    executeLoop(order,  attr,  elapsed, scriptedEntities, keys, entities, i, component){
        let inputs = {}, attributes = {...attr}

        for (let o = 0; o < order.length; o++) {
            const currentOrder = order[o]
            for (let inputO = 0; inputO < currentOrder.inputs.length; inputO++) {
                const currentInput = currentOrder.inputs[inputO]
                inputs[currentInput.localKey] = attributes[currentInput.sourceID][currentInput.sourceKey]
            }
            console.log(attributes)
            if (!currentOrder.isBranch)
                attributes = this.executors[currentOrder.classExecutor](elapsed, inputs, scriptedEntities, attributes, currentOrder.nodeID, component.executors, (newObj) => component.executors = newObj, this.renderTarget, this.pressedKeys, this.currentMousePosition)
            else {
                const newOrder = this.executors[currentOrder.classExecutor](inputs, currentOrder)
                if(Array.isArray(newOrder))
                    this.executeLoop(newOrder, attributes, elapsed, scriptedEntities, keys, scriptedEntities, i, component)
                break
            }
            inputs = {}
        }
    }
}

function handler(event){
    const addKey = event.currentTarget.addKey
    const removeKey = event.currentTarget.removeKey
    const setMouse = event.currentTarget.setMouse
    switch (event.type){
        case 'keydown':
            addKey(event.code)
            break
        case 'keyup':
            removeKey(event.code)
            break
        case 'mousemove':
            setMouse({x: event.clientX, y: event.clientY})
            break
        default:break
    }
}