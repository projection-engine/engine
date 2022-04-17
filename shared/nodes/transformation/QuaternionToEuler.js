import Node from "../../../../views/blueprints/base/Node";
import Transformation from "../../utils/workers/Transformation";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";

export default class QuaternionToEuler extends Node {
    euler = [0, 0, 0]
    x = 0
    y = 0
    z = 0
    constructor() {
        super(
            [
                {label: 'Quaternion', key: 'q', accept: [DATA_TYPES.VEC4]}
            ],
            [
            {label: 'Euler', key: 'euler', type: DATA_TYPES.VEC3},
            {label: 'X', key: 'x', type: DATA_TYPES.NUMBER},
            {label: 'Y', key: 'y', type: DATA_TYPES.NUMBER},
            {label: 'Z', key: 'z', type: DATA_TYPES.NUMBER}
        ]);
        this.name = 'QuaternionToEuler'
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }
    static compile(tick, {quat}, entities, attributes, nodeID) {
        attributes[nodeID] = {}
        const q = Transformation.getEuler(quat)
        attributes[nodeID].euler = q
        attributes[nodeID].x = q[0]
        attributes[nodeID].y = q[1]
        attributes[nodeID].z = q[2]

        return attributes

    }
}