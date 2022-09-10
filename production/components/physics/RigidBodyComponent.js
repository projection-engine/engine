import Component from "../Component";
import RIGID_BODY_PROPS from "../../data/component-props/RIGID_BODY_PROPS";

export default class RigidBodyComponent extends Component{
    _props = RIGID_BODY_PROPS
    name = "RIGID_BODY"

    mass = 1
    drag = 0
    useGravity = true
    isStatic = false

    constructor() {
        super()
    }
}