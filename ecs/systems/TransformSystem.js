import System from "../basic/System";
import TransformComponent from "../components/TransformComponent";
import {mat4} from "gl-matrix";
import {linearAlgebraMath} from "pj-math";

export default class TransformSystem extends System {

    constructor() {
        super(['TransformComponent']);
    }

    execute(entities) {

        super.execute()
        const filtered = this._hasComponent(entities)

        for (let i = 0; i < filtered.length; i++) {
            const current = filtered[i]
            if (current !== undefined && current.components.TransformComponent.changed) {

                const dependents = this._find(filtered, e => e.linkedTo === current.id)
                let newTransform = mat4.create()
                // TRANSFORM
                newTransform[12] = current.components.TransformComponent.translation[0]
                newTransform[13] = current.components.TransformComponent.translation[1]
                newTransform[14] = current.components.TransformComponent.translation[2]

                // ROTATE
                mat4.rotate(
                    newTransform,
                    newTransform,
                    current.components.TransformComponent.rotation[0],
                    [1, 0, 0]
                )
                mat4.rotate(
                    newTransform,
                    newTransform,
                    current.components.TransformComponent.rotation[1],
                    [0, 1, 0]
                )
                mat4.rotate(
                    newTransform,
                    newTransform,
                    current.components.TransformComponent.rotation[2],
                    [0, 0, 1]
                )

                // SCALE
                const scalingMatrix = mat4.create()
                scalingMatrix[0] = current.components.TransformComponent.scaling[0]
                scalingMatrix[5] = current.components.TransformComponent.scaling[1]
                scalingMatrix[10] = current.components.TransformComponent.scaling[2]

                mat4.multiply(
                    newTransform,
                    newTransform,
                    scalingMatrix
                )
                current.components.TransformComponent.transformationMatrix = newTransform
                for (let j = 0; j < dependents.length; j++) {
                    mat4.multiply(
                        dependents[j].components.TransformComponent.transformationMatrix,
                        current.components.TransformComponent.transformationMatrix,
                        dependents[j].components.TransformComponent.transformationMatrix
                    )

                    if (dependents[j].components.MeshComponent !== undefined)
                        dependents[j].components.MeshComponent.normalMatrix = this._updateNormalMatrix(dependents[j].components.TransformComponent.transformationMatrix)

                    dependents[j].components.TransformComponent.changed = false

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