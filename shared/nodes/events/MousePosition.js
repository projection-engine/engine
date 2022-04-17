import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class MousePosition extends Node {

    constructor() {
        super(
            [],
            [{label: 'Position', key: 'pos', type: DATA_TYPES.VEC2}],
        );
        this.name = 'MousePosition'
    }

    get type() {
        return NODE_TYPES.DATA
    }

    static compile(tick, inputs, entities, attributes, nodeID, exec, setExec, rTarget, keys, mousePos) {

        attributes[nodeID] = {}
        attributes[nodeID].pos = mousePos
        return attributes
    }
}