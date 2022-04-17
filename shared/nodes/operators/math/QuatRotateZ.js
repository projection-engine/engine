import Node from "../../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../../views/blueprints/base/NODE_TYPES";
import {quat} from "gl-matrix";


export default class QuatRotateZ extends Node {
    rotType = 'Global'
    constructor() {
        super([
            {label: 'Quaternion', key: 'vec', accept: [DATA_TYPES.VEC4]},
            {label: 'Angle', key: 'rad', accept: [DATA_TYPES.NUMBER]},
            {
                label: 'Type',
                key: 'rotType',
                bundled: true,
                type: DATA_TYPES.OPTIONS,
                options: [{label: 'Local', value: 'Local'}, {label: 'Global', value: 'Global'}]
            },
        ], [
            {label: 'Result', key: 'res', type: DATA_TYPES.VEC4},
        ]);
        this.name = 'QuatRotateZ'
        this.size = 1
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {vec, rad}, entities, attributes, nodeID, executors) {
        const quatA = quat.rotateZ([], [0, 0, 0, 1], rad)
        attributes[nodeID] = {}
        if (executors[nodeID].rotType === 'Global')
            attributes[nodeID].res = quat.multiply([], quatA, vec)
        else
            attributes[nodeID].res = quat.multiply([], vec, quatA)
        return attributes
    }
}