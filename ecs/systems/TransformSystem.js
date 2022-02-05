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
                let parent
                if (current.linkedTo)
                    parent = this._find(entities, (e) => e.id === current.linkedTo)[0]?.components.TransformComponent?.transformationMatrix


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
                if (current.components.SphereCollider) {
                    switch (current.components.SphereCollider.axis) {
                        case 'x':
                            if (current.components.TransformComponent.scaling[0] > 1)
                                current.components.SphereCollider.radius *= current.components.TransformComponent.scaling[0]
                            break
                        case 'y':
                            if (current.components.TransformComponent.scaling[1] > 1)
                                current.components.SphereCollider.radius *= current.components.TransformComponent.scaling[1]
                            break
                        case 'z':
                            if (current.components.TransformComponent.scaling[2] > 1)
                                current.components.SphereCollider.radius *= current.components.TransformComponent.scaling[2]
                            break
                    }
                }
                mat4.multiply(
                    newTransform,
                    newTransform,
                    scalingMatrix
                )

                if (parent)
                    mat4.multiply(
                        current.components.TransformComponent.transformationMatrix,
                        parent,
                        newTransform
                    )
                else {
                    current.components.TransformComponent.transformationMatrix = newTransform
                }

                for (let j = 0; j < filtered.length; j++) {
                    if (filtered[j].linkedTo === current.id)
                        filtered[j].components.TransformComponent.changed = true
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