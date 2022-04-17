import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class OnInterval extends Node {
    interval = 1000
    constructor() {
        super(
            [
                {label: 'Interval', key: 'interval', type: DATA_TYPES.NUMBER, bundled: true, precision: 0}
            ],
            [
                {key: 'execute', type: DATA_TYPES.EXECUTION},
            ],
        );
        this.name = 'OnInterval'
        this.size = 2
    }

    get type() {
        return NODE_TYPES.START_POINT
    }

    static compile({inputs, state, setState, object, executors, nodeID}) {

        if (!state.timeoutSet) {
            setState(true, 'timeoutSet')

            setInterval(() => setState(true, 'canContinue'), [executors[nodeID].interval])
        }
        if (state.canContinue) {
            setState(false, 'canContinue')
            return object.execute
        }

        return []
    }
}