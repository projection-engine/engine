import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";

export default class SetWorldTranslation extends Node {

    constructor() {
        super([

            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'Entity', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.TRANSFORM},
            {label: 'X', key: 'x', accept: [DATA_TYPES.NUMBER]},
            {label: 'Y', key: 'y', accept: [DATA_TYPES.NUMBER]},
            {label: 'Z', key: 'z', accept: [DATA_TYPES.NUMBER]},

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION}
        ]);
        this.name = 'SetWorldTranslation'
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {x, y, z, entity}, entities, attributes, nodeID) {
        entity.components[COMPONENTS.TRANSFORM].translation = [x, y, z]
        return attributes
    }
}