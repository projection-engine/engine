import Node from "../../../../views/blueprints/base/Node";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

const toDeg = 57.29
export default class UpdateCameraProjection extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]}
        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
        ]);
        this.name = 'UpdateCameraProjection'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {cameraRoot}, entities, attributes) {
        cameraRoot.updateProjection()
        return attributes
    }
}