import Node from "../../../../views/blueprints/base/Node";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

export default class SetCameraPosition extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'X', key: 'x', accept: [DATA_TYPES.NUMBER]},
            {label: 'Y', key: 'y', accept: [DATA_TYPES.NUMBER]},
            {label: 'Z', key: 'z', accept: [DATA_TYPES.NUMBER]},
        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
        ]);
        this.name = 'SetCameraPosition'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {x, y, z, cameraRoot}, entities, attributes) {

        cameraRoot.position[0] = x
        cameraRoot.position[1] = y
        cameraRoot.position[2] = z

        return attributes
    }
}