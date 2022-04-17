import Node from "../../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../../views/blueprints/base/NODE_TYPES";


export default class Mod extends Node {
    a = 0
    b = 0
    constructor() {
        super([
            {label: 'A', key: 'a', accept: [DATA_TYPES.NUMBER], bundled: true, type: DATA_TYPES.NUMBER},
            {label: 'B', key: 'b', accept: [DATA_TYPES.NUMBER], bundled: true, type: DATA_TYPES.NUMBER}
        ], [
            {label: 'Result', key: 'res', type: DATA_TYPES.NUMBER}
        ]);
        this.name = 'Modulo'
        this.size = 1
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {a, b}, entities, attributes, nodeID, executors) {
        const aValue = a !== undefined ? a : executors[nodeID].a,
            bValue = b !== undefined ? b : executors[nodeID].b
        attributes[nodeID] = {
            res: aValue % bValue
        }
        return attributes
    }
}