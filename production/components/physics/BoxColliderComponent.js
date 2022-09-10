import Component from "../Component";
import COLLIDER_PROPS from "../../data/component-props/COLLIDER_PROPS";

export default class BoxColliderComponent extends Component {
    _props = COLLIDER_PROPS
    name = "BOX_COLLIDER"
    center = [0, 0, 0]
    size = [1, 1, 1]

    constructor() {
        super()
    }
}