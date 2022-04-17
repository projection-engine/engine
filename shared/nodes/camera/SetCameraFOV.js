import Node from "../../../../views/blueprints/base/Node";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

const toDeg = 57.29
export default class SetCameraFOV extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'FOV', key: 'fov', accept: [DATA_TYPES.NUMBER]},

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
        ]);
        this.name = 'SetCameraFOV'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {fov, cameraRoot}, entities, attributes) {
        cameraRoot.fov = fov
        cameraRoot.updateProjection()
        return attributes
    }
}