import Node from "../../../../views/blueprints/base/Node";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

const toDeg = 57.29
export default class GetCameraRotation extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
            {label: 'Rotation', key: 'rot', type: DATA_TYPES.VEC4},

        ]);
        this.name = 'GetCameraRotation'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {cameraRoot}, entities, attributes, nodeID) {
        attributes[nodeID] = {
            rot: cameraRoot.rotation
        }
        return attributes
    }
}