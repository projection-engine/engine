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

import Subtract from "../../../../views/scripting/nodes/basic/Subtract";
import Divide from "../../../../views/scripting/nodes/basic/Divide";
import Add from "../../../../views/scripting/nodes/basic/Add";
import Multiply from "../../../../views/scripting/nodes/basic/Multiply";
import SetTransformationRelativeOrigin
    from "../../../../views/scripting/nodes/transformation/SetTransformationRelativeOrigin";
import SetLocalRotation from "../../../../views/scripting/nodes/transformation/SetLocalRotation";
import ToVector from "../../../../views/scripting/nodes/basic/ToVector";
import FromVector from "../../../../views/scripting/nodes/basic/FromVector";


export default class ScriptSystem extends System {

    constructor() {
        super([]);

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
            [FromVector.name]: FromVector.compile
        }


    }

    execute(options, systems, data, entities) {
        super.execute()
        const {
            scriptedEntities
        } = data

        const {
            canExecutePhysicsAnimation,
            camera,
            selected,
            shadingModel,
            injectMaterial,
            elapsed
        } = options

        if (canExecutePhysicsAnimation) {
            const keys = Object.keys(scriptedEntities)
            let attributes = {}
            for (let i = 0; i < keys.length; i++) {
                const component = scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].executionTemplate
                let inputs = {}

                for (let o = 0; o < component.order.length; o++) {
                    const currentNode = component.order[o]


                    for (let inputO = 0; inputO < currentNode.inputs.length; inputO++) {
                        const currentInput = currentNode.inputs[inputO]
                        inputs[currentInput.localKey] = attributes[currentInput.sourceID][currentInput.sourceKey]
                    }
                    attributes = this.executors[currentNode.classExecutor](elapsed, inputs, scriptedEntities[keys[i]], entities, attributes, currentNode.nodeID, component.executors, (newObj) => component.executors = newObj)
                    inputs = {}
                }
                attributes = {}
            }
        }
    }

}