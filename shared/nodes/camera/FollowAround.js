import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import {vec3} from "gl-matrix";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

export default class FollowAround extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'Entity', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.TRANSFORM}
        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
        ]);
        this.name = 'FollowAround'

    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {cameraRoot, entity}, entities, attributes) {
        const transform = entity.components[COMPONENTS.TRANSFORM]
        cameraRoot.rotation = transform.rotationQuat
        cameraRoot.translation = vec3.add([], transform.translation, cameraRoot.position)

        cameraRoot.updateViewMatrix()
        return attributes
    }
}