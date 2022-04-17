import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import {quat} from "gl-matrix";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

export default class SetLocalRotation extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'Entity', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.TRANSFORM},
            {label: 'Rotation Quat', key: 'quat', accept: [DATA_TYPES.VEC4]},
            {label: 'Rotation Euler', key: 'euler', accept: [DATA_TYPES.VEC3]
            },

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION}]);
        this.name = 'SetLocalRotation'
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }
    static  compile(tick, {quat, euler, entity}, entities, attributes, nodeID) {
        if (quat)
            entity.components[COMPONENTS.TRANSFORM].rotationQuat = quat
        else if (euler) {
            const quatA = [0, 0, 0, 1]

            quat.rotateX(quatA, quatA, euler[0])
            quat.rotateY(quatA, quatA, euler[1])
            quat.rotateZ(quatA, quatA, euler[2])

            entity.components[COMPONENTS.TRANSFORM].rotationQuat = quat.multiply([], entity.components[COMPONENTS.TRANSFORM].rotationQuat, quatA)
        }
        return attributes
    }
}