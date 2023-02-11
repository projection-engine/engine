import Component from "./Component";
import RIGID_BODY_PROPS from "../../static/component-props/RIGID_BODY_PROPS";
import COMPONENTS from "../../static/COMPONENTS";

export default class RigidBodyComponent extends Component {
    static get componentKey(): string {
        return COMPONENTS.RIGID_BODY
    }
    get componentKey(): string {
        return RigidBodyComponent.componentKey
    }

    _props = RIGID_BODY_PROPS

    mass = 1
    drag = 0
    inertia: [number, number, number] = [0, 0, 0]

    #motionState?: btDefaultMotionState
    #body?: btRigidBody
    #transform?: btTransform
    #inertia?: btVector3

    initialized: boolean =false

    get body(): btRigidBody | undefined {
        return this.#body
    }

    set body(data) {
        this.#body = data
    }

    get transform(): btTransform | undefined {
        return this.#transform
    }

    set transform(data) {
        this.#transform = data
    }

    get inertiaBody(): btVector3 | undefined {
        return this.#inertia
    }

    set inertiaBody(data: btVector3) {
        this.#inertia = data
    }

    get motionState(): btDefaultMotionState | undefined {
        return this.#motionState
    }

    set motionState(data) {
        this.#motionState = data
    }
}