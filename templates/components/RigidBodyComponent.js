import Component from "./Component";
import RIGID_BODY_PROPS from "../../static/component-props/RIGID_BODY_PROPS";

export default class RigidBodyComponent extends Component {
    _props = RIGID_BODY_PROPS
    name = "RIGID_BODY"

    mass = 1
    drag = 0
    inertia = [0, 0, 0]

    __transform
    __motionState
    __body
    __inertia
    __initialized
}