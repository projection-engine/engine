import System from "../basic/System";
import {mat4} from "gl-matrix";
import {linearAlgebraMath} from "pj-math";
import Transformation from "../../utils/workers/Transformation";
import COMPONENTS from "../../templates/COMPONENTS";

export default class TransformSystem extends System {
    _changed = false
    _changedMeshes = []


    constructor() {
        super([]);
    }

    get changed() {
        return this._changed
    }

    execute(options, systems, data, entities) {
        super.execute()
        this._changed = false
        this._changedMeshes = []
        for (let i = 0; i < entities.length; i++) {
            const current = entities[i]
            if (current !== undefined && (current.components.TransformComponent?.changed || current.components[COMPONENTS.CAMERA]?.changed)) {
                if (current.components[COMPONENTS.CAMERA]) {
                    current.components[COMPONENTS.CAMERA].updateProjectionMatrix()
                    current.components[COMPONENTS.CAMERA].updateViewMatrix(current.components[COMPONENTS.TRANSFORM].translation, current.components[COMPONENTS.TRANSFORM].rotation)
                }

                this._changedMeshes.push(current)
                this._changed = true
                let parent
                if (current.linkedTo)
                    parent = this._find(entities, (e) => e.id === current.linkedTo)[0]?.components.TransformComponent?.transformationMatrix
                const component = current.components.TransformComponent
                const transformationMatrix = Transformation.transform(component.translation, component.rotationQuat, component.scaling, options.rotationType, component.transformationMatrix)

                if (current.components[COMPONENTS.COLLIDER]) {
                    switch (current.components[COMPONENTS.COLLIDER].axis) {
                        case 'x':
                            if (current.components.TransformComponent.scaling[0] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[0]
                            break
                        case 'y':
                            if (current.components.TransformComponent.scaling[1] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[1]
                            break
                        case 'z':
                            if (current.components.TransformComponent.scaling[2] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[2]
                            break
                    }
                }

                if (parent)
                    mat4.multiply(
                        current.components.TransformComponent.transformationMatrix,
                        mat4.fromTranslation([], mat4.getTranslation([], parent)),
                        transformationMatrix
                    )
                else
                    current.components.TransformComponent.transformationMatrix = transformationMatrix

                for (let j = 0; j < entities.length; j++) {
                    if (entities[j].components.TransformComponent && entities[j].linkedTo === current.id)
                        entities[j].components.TransformComponent.changed = true
                }
                current.components.TransformComponent.changed = false
                if (current.components.MeshComponent !== undefined)
                    current.components.MeshComponent.normalMatrix = this._updateNormalMatrix(current.components.TransformComponent.transformationMatrix)
            }
        }
}

_updateNormalMatrix(transformationMatrix) {
    return linearAlgebraMath.normalMatrix(Array.from(transformationMatrix))
}
}
