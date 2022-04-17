import Node from "../../../../views/blueprints/base/Node";
import COMPONENTS from "../../templates/COMPONENTS";
import NODE_TYPES from "../../../../views/blueprints/base/NODE_TYPES";
import {DATA_TYPES} from "../../../../views/blueprints/base/DATA_TYPES";

export default class SetViewTargetWithBlend extends Node {

    constructor() {
        super([
                {label: 'Start', key: 'start', accept: [DATA_TYPES.EXECUTION]},
                {label: 'Target Camera', key: 'entity', accept: [DATA_TYPES.ENTITY], componentRequired: COMPONENTS.CAMERA},
                {
                    label: 'Blend function',
                    key: 'func',
                    type: DATA_TYPES.OPTIONS,
                    bundled: true,
                    options: [{value: 'Linear', key: 'Linear'}]
                },
            ],
            [
                {label: 'Execute', key: 'EXECUTION', type: DATA_TYPES.EXECUTION}
            ]);
        this.name = 'SetViewTargetWithBlend'
    }

    get type() {
        return NODE_TYPES.VOID_FUNCTION
    }

    static compile(tick, {entity, cameraRoot}, entities, attributes) {
        const comp = entity.components[COMPONENTS.CAMERA]
        const transform = entity.components[COMPONENTS.TRANSFORM]

        cameraRoot.position = transform.translation
        cameraRoot.rotation = transform.rotationQuat

        cameraRoot.zFar = comp.zFar
        cameraRoot.zNear = comp.zNear

        cameraRoot.fov = comp.fov
        cameraRoot.aspectRatio = comp.aspectRatio


        cameraRoot.updateViewMatrix()
        cameraRoot.updateProjection()

        return attributes
    }
}
