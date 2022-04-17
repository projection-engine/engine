import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";

export default class GetWorldTranslation extends Node {

    constructor() {
        super(
            [
                {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Entity', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.TRANSFORM},
            ],
            [
                {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION},

                {label: 'X', key: 'x', type: DATA_TYPES.NUMBER},
                {label: 'Y', key: 'y', type: DATA_TYPES.NUMBER},
                {label: 'Z', key: 'z', type: DATA_TYPES.NUMBER}
            ]);
        this.name = 'GetWorldTranslation'
    }

    get type() {
        return NODE_TYPES.FUNCTION
    }

    static compile(tick, {entity}, entities, attributes, nodeID) {

        attributes[nodeID] = {}
        attributes[nodeID].x = entity.components[COMPONENTS.TRANSFORM].translation[0]
        attributes[nodeID].y = entity.components[COMPONENTS.TRANSFORM].translation[1]
        attributes[nodeID].z = entity.components[COMPONENTS.TRANSFORM].translation[2]


        return attributes
    }
}