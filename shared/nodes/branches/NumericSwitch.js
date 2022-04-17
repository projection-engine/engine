import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";


export default class NumericSwitch extends Node {

    constructor() {
        super(
            [
                { key: 'line', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Selection', key: 'selection', accept: [DATA_TYPES.NUMBER]}
            ],
            [
                {label: 'True', key: 'trueLine', type: DATA_TYPES.EXECUTION, showTitle: true},
                {label: 'False', key: 'falseLine', type: DATA_TYPES.EXECUTION, showTitle: true},
            ],
        );
        this.name = 'NumericSwitch'
        this.size = 1
        this.expandableInputs = true
    }
    expandInput(name){

    }

    get type() {
        return NODE_TYPES.BRANCH
    }

    static compile({
                       inputs,
                       object
                   }) {
        return inputs.condition ? object.trueLine : object.falseLine
    }
}