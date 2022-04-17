import System from "../basic/System";
import EventTick from "../../nodes/events/EventTick";
import GetWorldRotation from "../../nodes/transformation/GetWorldRotation";
import GetWorldTranslation from "../../nodes/transformation/GetWorldTranslation";
import SetWorldRotation from "../../nodes/transformation/SetWorldRotation";
import SetWorldTranslation from "../../nodes/transformation/SetWorldTranslation";
import QuaternionToEuler from "../../nodes/transformation/QuaternionToEuler";
import COMPONENTS from "../../templates/COMPONENTS";
import Getter from "../../nodes/utils/Getter";
import Setter from "../../nodes/utils/Setter";

import Subtract from "../../nodes/operators/math/Subtract";
import Divide from "../../nodes/operators/math/Divide";
import Add from "../../nodes/operators/math/Add";
import Multiply from "../../nodes/operators/math/Multiply";
import SetTransformationRelativeOrigin
    from "../../nodes/transformation/SetTransformationRelativeOrigin";
import SetLocalRotation from "../../nodes/transformation/SetLocalRotation";
import ToVector from "../../nodes/operators/conversions/ToVector";
import FromVector from "../../nodes/operators/conversions/FromVector";
import Print from "../../nodes/utils/Print";
import And from "../../nodes/operators/boolean/And";
import Branch from "../../nodes/branches/Branch";
import Equal from "../../nodes/operators/boolean/Equal";
import Greater from "../../nodes/operators/boolean/Greater";
import GreaterEqual from "../../nodes/operators/boolean/GreaterEqual";
import Less from "../../nodes/operators/boolean/Less";
import LessEqual from "../../nodes/operators/boolean/LessEqual";
import Nand from "../../nodes/operators/boolean/Nand";
import Nor from "../../nodes/operators/boolean/Nor";
import Not from "../../nodes/operators/boolean/Not";
import NotEqual from "../../nodes/operators/boolean/NotEqual";
import Or from "../../nodes/operators/boolean/Or";
import Xor from "../../nodes/operators/boolean/Xor";
import RandomInt from "../../nodes/utils/RandomInt";
import RandomFloat from "../../nodes/utils/RandomFloat";
import MouseX from "../../nodes/events/MouseX";
import MouseY from "../../nodes/events/MouseY";
import MousePosition from "../../nodes/events/MousePosition";
import EntityReference from "../../nodes/events/EntityReference";
import Cos from "../../nodes/operators/math/Cos";
import Sin from "../../nodes/operators/math/Sin";
import ASin from "../../nodes/operators/math/ASin";
import ACos from "../../nodes/operators/math/ACos";
import ATan from "../../nodes/operators/math/ATan";
import Tan from "../../nodes/operators/math/Tan";
import Mod from "../../nodes/operators/math/Mod";
import Abs from "../../nodes/operators/math/Abs";
import KeyPress from "../../nodes/events/KeyPress";
import RotateVector from "../../nodes/transformation/RotateVector";

import GetCameraPosition from "../../nodes/camera/GetCameraPosition";
import GetCameraRotation from "../../nodes/camera/GetCameraRotation";

import SetCameraFOV from "../../nodes/camera/SetCameraFOV";
import SetCameraPosition from "../../nodes/camera/SetCameraPosition";
import SetCameraRotation from "../../nodes/camera/SetCameraRotation";
import UpdateCameraLookAt from "../../nodes/camera/UpdateCameraLookAt";
import UpdateCameraProjection from "../../nodes/camera/UpdateCameraProjection";
import SetViewTarget from "../../nodes/camera/SetViewTarget";
import OnSpawn from "../../nodes/events/OnSpawn";
import QuatRotateX from "../../nodes/operators/math/QuatRotateX";
import QuatRotateY from "../../nodes/operators/math/QuatRotateY";
import QuatRotateZ from "../../nodes/operators/math/QuatRotateZ";
import OnInterval from "../../nodes/events/OnInterval";
import FollowAround from "../../nodes/camera/FollowAround";


export default class ScriptSystem extends System {
    pressedKeys = {}
    eventSet = false
    metrics = {x: 0, y: 0, width: 0, height: 0}
    state = {}

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

            [Cos.name]: Cos.compile,
            [Sin.name]: Sin.compile,
            [ASin.name]: ASin.compile,
            [ACos.name]: ACos.compile,
            [ATan.name]: ATan.compile,
            [Tan.name]: Tan.compile,
            [Mod.name]: Mod.compile,
            [Abs.name]: Abs.compile,
            [KeyPress.name]: KeyPress.compile,

            [RotateVector.name]: RotateVector.compile,
            [GetCameraPosition.name]: GetCameraPosition.compile,
            [GetCameraRotation.name]: GetCameraRotation.compile,
            [SetCameraFOV.name]: SetCameraFOV.compile,
            [SetCameraPosition.name]: SetCameraPosition.compile,
            [SetCameraRotation.name]: SetCameraRotation.compile,
            [UpdateCameraLookAt.name]: UpdateCameraLookAt.compile,
            [UpdateCameraProjection.name]: UpdateCameraProjection.compile,
            [SetViewTarget.name]: SetViewTarget.compile,
            [OnSpawn.name]: OnSpawn.compile,

            [QuatRotateY.name]: QuatRotateY.compile,
            [QuatRotateX.name]: QuatRotateX.compile,
            [QuatRotateZ.name]: QuatRotateZ.compile,

            [OnInterval.name]: OnInterval.compile,
            [FollowAround.name]: FollowAround.compile

        }
        document.addKey = (key) => {
            this.pressedKeys[key] = true
        }
        document.removeKey = (key) => {
            delete this.pressedKeys[key]
        }
        document.setMouse = (position) => {
            this.metrics = position
        }

        this.observer = new ResizeObserver(() => {
            this.metrics.width = window.innerWidth
            this.metrics.height = window.innerHeight
        })
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
                this.observer.observe(document.body)
            }

            this.renderTarget.style.display = 'block'
            const keys = Object.keys(scriptedEntities)


            for (let i = 0; i < keys.length; i++) {
                const currentS = scripts[scriptedEntities[keys[i]].components[COMPONENTS.SCRIPT].registryID].executors

                for (let j = 0; j < currentS?.length; j++) {
                    if (currentS[j]) {
                        let order = currentS[j].order
                        this.executeLoop(order, {}, elapsed, scriptedEntities, keys, entities, currentS[j], camera)
                    }
                }
            }

            const levelExecution = scripts[this.id].executors
            for (let j = 0; j < levelExecution?.length; j++) {
                if (levelExecution[j]) {
                    let order = levelExecution[j].order
                    this.executeLoop(order, {}, elapsed, entitiesMap, keys, entities, levelExecution[j], camera)
                }
            }
        } else if (this.eventSet) {
            lockCamera(false)

            this.state = {}
            this.eventSet = false
            this.renderTarget.style.display = 'none'
            this.renderTarget.innerText = ''
            document.removeEventListener('mouseup', handler)
            document.removeEventListener('mousedown', handler)
            document.removeEventListener('keydown', handler)
            document.removeEventListener('keyup', handler)
            document.removeEventListener('mousemove', handler)
            this.observer.unobserve(document.body)
        }
    }

    executeLoop(order, attr, elapsed, scriptedEntities, keys, entities, component, camera) {
        let inputs = {}, attributes = {...attr}

        for (let o = 0; o < order.length; o++) {
            const currentOrder = order[o]

            for (let inputO = 0; inputO < currentOrder.inputs.length; inputO++) {
                const currentInput = currentOrder.inputs[inputO]
                inputs[currentInput.localKey] = attributes[currentInput.sourceID][currentInput.sourceKey]
            }
            inputs.cameraRoot = camera

            if (!currentOrder.isBranch)
                attributes = this.executors[currentOrder.classExecutor](
                    elapsed,
                    inputs,
                    scriptedEntities,
                    attributes,
                    currentOrder.nodeID,
                    component.executors,
                    (newObj) => component.executors = newObj,
                    this.renderTarget,
                    this.pressedKeys,
                    this.metrics,
                    this.state[currentOrder.nodeID], (value, key) => {
                        if (!this.state[currentOrder.nodeID])
                            this.state[currentOrder.nodeID] = {}
                        this.state[currentOrder.nodeID][key] = value
                    })
            else {
                const newOrder = this.executors[currentOrder.classExecutor]({
                    inputs,
                    object: currentOrder,
                    nodeID: currentOrder.nodeID,
                    executors: component.executors,
                    keys: this.pressedKeys,
                    state: this.state[currentOrder.nodeID] ? this.state[currentOrder.nodeID] : {},
                    setState: (value, key) => {
                        if (!this.state[currentOrder.nodeID])
                            this.state[currentOrder.nodeID] = {}
                        this.state[currentOrder.nodeID][key] = value
                    },
                    metrics: this.metrics,
                    timeStamp: elapsed
                })
                if (Array.isArray(newOrder))
                    this.executeLoop(newOrder, attributes, elapsed, scriptedEntities, keys, scriptedEntities, component, camera)
                break
            }
            inputs = {}
        }
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