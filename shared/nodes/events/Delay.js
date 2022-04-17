import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class Delay extends Node {

    constructor() {
        super(
            [
                {key: 'line', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Delay', key: 'delay', accept: [DATA_TYPES.NUMBER]},
                {label: 'Reset', key: 'reset', accept: [DATA_TYPES.BOOL]},
            ],
            [
                {key: 'execute', type: DATA_TYPES.EXECUTION},
            ],
        );
        this.name = 'Delay'
    }

    get type() {
        return NODE_TYPES.BRANCH
    }

    static compile({inputs, state, setState, object}) {
        if (inputs.reset) {
            clearTimeout(state.timeout)
            setState(false, 'timeoutSet')
            setState(false, 'canContinue')
        }
        if (!state.canContinue && !state.timeoutSet) {
            setState(true, 'timeoutSet')
            setState(setTimeout(() => setState(true, 'canContinue'), [inputs.delay]), 'timeout')
        } else if (state.canContinue)
            return object.execute

        return []
    }
}