import Node from "../../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../../views/blueprints/base/NODE_TYPES";


export default class FromVector extends Node {
    constructor() {
        super([
            {label: 'Vector', key: 'v', accept: [DATA_TYPES.VEC2, DATA_TYPES.VEC3, DATA_TYPES.VEC4]}
        ], [
            {label: 'X', key: 'x', type: DATA_TYPES.NUMBER},
            {label: 'Y', key: 'y', type: DATA_TYPES.NUMBER},
            {label: 'Z', key: 'z', type: DATA_TYPES.NUMBER},
            {label: 'W', key: 'w', type: DATA_TYPES.NUMBER},
        ]);
        this.name = 'FromVector'
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {v}, entities, attributes, nodeID) {
        attributes[nodeID] = {}

        attributes[nodeID].x = v[0]
        attributes[nodeID].y = v[1]
        attributes[nodeID].z = v[2]
        attributes[nodeID].w = v[3]

        return attributes
    }
}