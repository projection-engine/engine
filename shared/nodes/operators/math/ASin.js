import Node from "../../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../../views/blueprints/base/NODE_TYPES";


export default class ASin extends Node {
    constructor() {
        super([
            {label: 'A', key: 'a', accept: [DATA_TYPES.NUMBER]}
        ], [
            {label: 'Result', key: 'res', type: DATA_TYPES.NUMBER}
        ]);
        this.name = 'ArcSine'
        this.size = 1
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {a}, entities, attributes, nodeID) {
        attributes[nodeID] = {}
        attributes[nodeID].res = Math.asin(a)

        return attributes
    }
}