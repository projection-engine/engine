import Component from "../Component";
import CAMERA_PROPS from "../../data/component-props/CAMERA_PROPS";
import COLLIDER_PROPS from "../../data/component-props/COLLIDER_PROPS";

export default class CapsuleColliderComponent extends Component{
    static DIRECTIONS = {X: "X", Y: "Y", Z: "Z"}
    _props = COLLIDER_PROPS
    name = "CAPSULE_COLLIDER"
    center = [0,0,0]
    radius = 1
    height = 1
    direction = CapsuleColliderComponent.DIRECTIONS.Y

    constructor() {
        super()
    }

}