import Node from "../../../../views/blueprints/base/Node";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

const toDeg = 57.29
export default class GetCameraPosition extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},
            {label: 'X', key: 'x', type: DATA_TYPES.NUMBER},
            {label: 'Y', key: 'y', type: DATA_TYPES.NUMBER},
            {label: 'Z', key: 'z', type: DATA_TYPES.NUMBER},
        ]);
        this.name = 'GetCameraPosition'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {cameraRoot}, entities, attributes, nodeID) {


        attributes[nodeID] = {}
        attributes[nodeID].x = cameraRoot.position[0]
        attributes[nodeID].y = cameraRoot.position[1]
        attributes[nodeID].z = cameraRoot.position[2]

        return attributes
    }
}