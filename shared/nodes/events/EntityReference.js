import Node from "../../../../views/blueprints/base/Node";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";

import {v4 as uuidv4} from 'uuid';

export default class EntityReference extends Node {
    constructor(id, name, components) {
        super(
            [],
            [
                {label: 'Entity', key: 'entity', type: DATA_TYPES.ENTITY, components: components}
            ]);
        this.size = 2
        this.id = id + '/' + uuidv4()
        this.name = name
    }

    get type() {
        return NODE_TYPES.REFERENCE
    }

    static compile(tick, inputs, entities, attributes, nodeID, executors) {

        attributes[nodeID] = {}
        attributes[nodeID].entity = entities[executors[nodeID].value]

        return attributes
    }
}