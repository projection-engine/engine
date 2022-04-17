import Node from "../../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../../views/blueprints/base/NODE_TYPES";


export default class ToVector extends Node {
    constructor() {
        super([
            {label: 'X', key: 'x', accept: [DATA_TYPES.NUMBER]},
            {label: 'Y', key: 'y', accept: [DATA_TYPES.NUMBER]},
            {label: 'Z', key: 'z', accept: [DATA_TYPES.NUMBER]},
            {label: 'W', key: 'w', accept: [DATA_TYPES.NUMBER]},
        ], [
            {label: 'Vector 2D', key: 'v2', type: DATA_TYPES.VEC2},
            {label: 'Vector 3D', key: 'v3', type: DATA_TYPES.VEC3},
            {label: 'Vector 4D', key: 'v4', type: DATA_TYPES.VEC4}
        ]);
        this.name = 'ToVector'
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {x, y, z, w}, entities, attributes, nodeID) {
        attributes[nodeID] = {}

        attributes[nodeID].v2 = [x, y]
        attributes[nodeID].v3 = [x, y, z]
        attributes[nodeID].v4 = [x, y, z, w]

        return attributes
    }
}