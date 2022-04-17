import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class Print extends Node {

    constructor() {
        super([
                {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Data', key: 'data', accept: [DATA_TYPES.ANY], bundled: true, type: DATA_TYPES.STRING}
            ],
            [{label: 'Tick', key: 'tick', type: DATA_TYPES.EXECUTION}]);
        this.name = 'Print'
        this.size = 1
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {data}, entities, attributes, nodeID, executors, setExecutors, renderTarget) {
        renderTarget.innerText = JSON.stringify(data !== undefined ? data : executors[nodeID].data)
        return attributes
    }
}