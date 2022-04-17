import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {vec3, vec4} from "gl-matrix";


export default class RotateVector extends Node {

    constructor() {
        super(
            [
                {label: 'Quat', key: 'a', accept: [DATA_TYPES.VEC4]},
                {label: 'Vector', key: 'b', accept: [DATA_TYPES.VEC3, DATA_TYPES.VEC4]}
            ],
            [
                {label: 'Result', key: 'res', type: DATA_TYPES.BOOL}
            ],
        );
        this.name = 'RotateVector'
    }

    get type (){
        return NODE_TYPES.FUNCTION
    }
    static compile(tick, {a, b},  entities, attributes, nodeID) {

        attributes[nodeID] = {}
        attributes[nodeID].res = (b.length === 3 ? vec3 : vec4).transformQuat([], b, a)

        return attributes
    }
}