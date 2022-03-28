import System from "../basic/System";
import EventTick from "../../../../views/scripting/nodes/EventTick";
import GetWorldRotation from "../../../../views/scripting/nodes/transformation/GetWorldRotation";
import GetWorldTranslation from "../../../../views/scripting/nodes/transformation/GetWorldTranslation";
import SetWorldRotation from "../../../../views/scripting/nodes/transformation/SetWorldRotation";
import SetWorldTranslation from "../../../../views/scripting/nodes/transformation/SetWorldTranslation";
import QuaternionToEuler from "../../../../views/scripting/nodes/QuaternionToEuler";
import COMPONENTS from "../../templates/COMPONENTS";
import Getter from "../../../../views/scripting/nodes/Getter";
import Setter from "../../../../views/scripting/nodes/Setter";

import Subtract from "../../../../views/scripting/nodes/operators/math/Subtract";
import Divide from "../../../../views/scripting/nodes/operators/math/Divide";
import Add from "../../../../views/scripting/nodes/operators/math/Add";
import Multiply from "../../../../views/scripting/nodes/operators/math/Multiply";
import SetTransformationRelativeOrigin
    from "../../../../views/scripting/nodes/transformation/SetTransformationRelativeOrigin";
import SetLocalRotation from "../../../../views/scripting/nodes/transformation/SetLocalRotation";
import ToVector from "../../../../views/scripting/nodes/operators/conversions/ToVector";
import FromVector from "../../../../views/scripting/nodes/operators/conversions/FromVector";
import Print from "../../../../views/scripting/nodes/Print";
import And from "../../../../views/scripting/nodes/operators/boolean/And";
import Branch from "../../../../views/scripting/nodes/operators/boolean/Branch";
import Equal from "../../../../views/scripting/nodes/operators/boolean/Equal";
import Greater from "../../../../views/scripting/nodes/operators/boolean/Greater";
import GreaterEqual from "../../../../views/scripting/nodes/operators/boolean/GreaterEqual";
import Less from "../../../../views/scripting/nodes/operators/boolean/Less";
import LessEqual from "../../../../views/scripting/nodes/operators/boolean/LessEqual";
import Nand from "../../../../views/scripting/nodes/operators/boolean/Nand";
import Nor from "../../../../views/scripting/nodes/operators/boolean/Nor";
import Not from "../../../../views/scripting/nodes/operators/boolean/Not";
import NotEqual from "../../../../views/scripting/nodes/operators/boolean/NotEqual";
import Or from "../../../../views/scripting/nodes/operators/boolean/Or";
import Xor from "../../../../views/scripting/nodes/operators/boolean/Xor";


export default class ScriptSystem extends System {

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
                color: 'white', padding: '8px', fontSize: '.75rem'
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

            elapsed
        } = options

        if (canExecutePhysicsAnimation) {
            this.renderTarget.style.display = 'block'
            const keys = Object.keys(scriptedEntities)
            let attributes = {}
            for (let i = 0; i < keys.length; i++) {
                const component = scripts[scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].registryID].executor

                if (component) {
                    let inputs = {}, order = component.order
                    this.executeLoop(order, attributes, elapsed, scriptedEntities, keys, entities, i, component)
                    // for (let o = 0; o < order.length; o++) {
                    //     const currentOrder = order[o]
                    //     for (let inputO = 0; inputO < currentOrder.inputs.length; inputO++) {
                    //         const currentInput = currentOrder.inputs[inputO]
                    //         inputs[currentInput.localKey] = attributes[currentInput.sourceID][currentInput.sourceKey]
                    //     }
                    //     if (!currentOrder.isBranch)
                    //         attributes = this.executors[currentOrder.classExecutor](elapsed, inputs, scriptedEntities[keys[i]], entities, attributes, currentOrder.nodeID, component.executors, (newObj) => component.executors = newObj, this.renderTarget)
                    //     else {
                    //         order = this.executors[currentOrder.classExecutor](inputs, currentOrder)
                    //         break
                    //     }
                    //     inputs = {}
                    // }
                    attributes = {}
                }
            }
        } else
            this.renderTarget.style.display = 'none'
    }

    executeLoop(order,  attr,  elapsed, scriptedEntities, keys, entities, i, component){
        let inputs = {}, attributes = {...attr}

        for (let o = 0; o < order.length; o++) {
            const currentOrder = order[o]
            console.log(attributes, currentOrder, order, o)
            for (let inputO = 0; inputO < currentOrder.inputs.length; inputO++) {
                const currentInput = currentOrder.inputs[inputO]

                inputs[currentInput.localKey] = attributes[currentInput.sourceID][currentInput.sourceKey]
            }
            if (!currentOrder.isBranch)
                attributes = this.executors[currentOrder.classExecutor](elapsed, inputs, scriptedEntities[keys[i]], entities, attributes, currentOrder.nodeID, component.executors, (newObj) => component.executors = newObj, this.renderTarget)
            else {
                const newOrder = this.executors[currentOrder.classExecutor](inputs, currentOrder)
                console.log(newOrder, currentOrder, inputs)
                if(Array.isArray(newOrder))
                    this.executeLoop(newOrder, attributes, elapsed, scriptedEntities, keys, entities, i, component)
                break
            }
            inputs = {}
        }
    }

}