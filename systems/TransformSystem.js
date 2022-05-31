import System from "../basic/System"
import {mat4} from "gl-matrix"
import {linearAlgebraMath} from "pj-math"
import Transformation from "../instances/Transformation"
import COMPONENTS from "../templates/COMPONENTS"

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
        const l = entities.length
        for (let i = 0; i < l; i++) {
            const current = entities[i]
            if (current !== undefined && (current.components[COMPONENTS.TRANSFORM]?.changed)) {
                this._changedMeshes.push(current)
                this._changed = true
                let parent
                if (current.linkedTo) {
                    parent = entities.find((e) => e.id === current.linkedTo)
                    if(parent && parent.components[COMPONENTS.TRANSFORM])
                        parent = parent.components[COMPONENTS.TRANSFORM].transformationMatrix
                    else
                        parent =undefined
                }
                const component = current.components[COMPONENTS.TRANSFORM]
                const transformationMatrix = Transformation.transform(component.translation, component.rotationQuat, component.scaling, options.rotationType, component.transformationMatrix)

                if (current.components[COMPONENTS.COLLIDER]) {
                    switch (current.components[COMPONENTS.COLLIDER].axis) {
                        case 'x':
                            if (current.components[COMPONENTS.TRANSFORM].scaling[0] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[0]
                            break
                        case 'y':
                            if (current.components[COMPONENTS.TRANSFORM].scaling[1] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[1]
                            break
                        case 'z':
                            if (current.components[COMPONENTS.TRANSFORM].scaling[2] > 1)
                                current.components[COMPONENTS.COLLIDER].radius *= component.scaling[2]
                            break
                    }
                }

                if (parent)
                    mat4.multiply(
                        current.components[COMPONENTS.TRANSFORM].transformationMatrix,
                        parent,
                        transformationMatrix
                    )
                else
                    current.components[COMPONENTS.TRANSFORM].transformationMatrix = transformationMatrix


                // TODO - PUT THIS SOMEWHERE ELSE (DEV)
                const isProbe =current.components[COMPONENTS.PROBE]
                if(isProbe){
                    for(let k in isProbe.probes){
                        isProbe.probes[k].transformedMatrix = mat4.multiply(
                            [],
                            transformationMatrix,
                            isProbe.probes[k].transformationMatrix
                        )
                    }
                }
                const lT= entities.length
                for (let j = 0; j < lT; j++) {
                    if (entities[j].components[COMPONENTS.TRANSFORM] && entities[j].linkedTo === current.id)
                        entities[j].components[COMPONENTS.TRANSFORM].changed = true
                }
                current.components[COMPONENTS.TRANSFORM].changed = false
                if (current.components[COMPONENTS.MESH] !== undefined)
                    current.components[COMPONENTS.MESH].normalMatrix = this._updateNormalMatrix(current.components[COMPONENTS.TRANSFORM].transformationMatrix)
            }
        }
}

_updateNormalMatrix(transformationMatrix) {
    return linearAlgebraMath.normalMatrix(Array.from(transformationMatrix))
}
}
