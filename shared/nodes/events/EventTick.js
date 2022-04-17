import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class EventTick extends Node {
    tick = 0
    canBeDeleted = true
    constructor() {
        super([], [{label: 'Tick', key: 'execute', type: DATA_TYPES.EXECUTION}]);
        this.name = 'EventTick'
        this.size = 2
    }

    get type (){
        return NODE_TYPES.START_POINT
    }
    static compile({object}) {
        return object.execute
    }
}