import Node from "../../../../views/blueprints/base/Node";
import {quat} from "gl-matrix";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

export default class SetCameraRotation extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'Rotation', key: 'rot', accept: [DATA_TYPES.VEC4]},

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
        ]);
        this.name = 'SetCameraRotation'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {rot, cameraRoot}, entities, attributes) {
        cameraRoot.rotation = quat.normalize([], rot)
        return attributes
    }
}