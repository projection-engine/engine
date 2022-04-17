import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class RandomFloat extends Node {

    constructor() {
        super([

                {label: 'Max', key: 'max', accept: [DATA_TYPES.NUMBER]},
                {label: 'Min', key: 'min', accept: [DATA_TYPES.NUMBER]}
            ],
            [{label: 'Number', key: 'num', type: DATA_TYPES.NUMBER}]);
        this.name = 'RandomFloat'
    }

    get type (){
        return NODE_TYPES.FUNCTION
    }
    static compile(tick, {max, min}, entities, attributes, nodeID) {
        attributes[nodeID] = {}
        attributes[nodeID].num = Math.random() * (max - min + 1) + min
        return attributes

    }
}