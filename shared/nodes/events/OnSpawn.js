import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class OnSpawn extends Node {

    constructor() {
        super(
            [],
            [
                {key: 'execute', type: DATA_TYPES.EXECUTION}
            ]);
        this.size = 1
        this.name = 'OnSpawn'
    }

    get type() {
        return NODE_TYPES.START_POINT
    }

    static compile({
                       state,
                       setState,
        object
                   }) {
        if (!state.wasExecuted) {
            setState(true, 'wasExecuted')
            return object.execute
        }
        return []
    }
}