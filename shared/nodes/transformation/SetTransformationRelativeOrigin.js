import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import {mat4, quat} from "gl-matrix";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

const toDeg = 57.29
export default class SetTransformationRelativeOrigin extends Node {

    constructor() {
        super([
            {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
            {label: 'Entity', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.TRANSFORM},
            {label: 'Translation', key: 't', accept: [DATA_TYPES.VEC3]},
            {label: 'Rotation', key: 'r', accept: [DATA_TYPES.VEC4, DATA_TYPES.VEC3]},
            {label: 'Scale', key: 's', accept: [DATA_TYPES.VEC3]},
            {label: 'Origin', key: 'o', accept: [DATA_TYPES.VEC3]},

        ], [
            {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION}
        ]);
        this.name = 'SetTransformationRelativeOrigin'
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {t, r, s, o, entity}, entities, attributes) {
        let rotation = r
        if (r.length === 3)
            rotation = quat.fromEuler([], r[0] * toDeg, r[1] * toDeg, r[2] * toDeg)

        const m = mat4.fromRotationTranslationScaleOrigin([], rotation, t, s, o)

        entity.components[COMPONENTS.TRANSFORM].translation = mat4.getTranslation([], m)
        entity.components[COMPONENTS.TRANSFORM].scaling = mat4.getScaling([], m)
        entity.components[COMPONENTS.TRANSFORM].rotationQuat = mat4.getRotation([], m)

        return attributes
    }
}