import Component from "../Component";
import COLLIDER_PROPS from "../../data/component-props/COLLIDER_PROPS";

export default class SphereColliderComponent extends Component{
    _props = COLLIDER_PROPS
    name = "SPHERE_COLLIDER"

    center = [0,0,0]
    radius = 1

    constructor() {
        super()
    }


}