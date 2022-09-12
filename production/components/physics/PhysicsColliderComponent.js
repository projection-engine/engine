import Component from "../Component";
import COLLISION_TYPES from "../../../static/COLLISION_TYPES";
import PHYSICS_COLLIDER_PROPS from "../../../static/component-props/PHYSICS_COLLIDER_PROPS";

export default class PhysicsColliderComponent extends Component{
    _props = PHYSICS_COLLIDER_PROPS
    name = "PHYSICS_COLLIDER"

    collisionType = COLLISION_TYPES.BOX
    direction = "Y"
    center = [0,0,0]
    size = [1,1,1]
    height = 1
    radius = 1

    __shape
    __initialized

}