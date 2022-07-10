import {mat4} from "gl-matrix"
import {linearAlgebraMath} from "pj-math"
import Transformation from "../../utils/Transformation"
import COMPONENTS from "../../templates/COMPONENTS"

export default class Transformations {
    changed = new Map()

    execute(options, data, entities) {
        const l = entities.length
        for (let i = 0; i < l; i++) {
            const current = entities[i]
            if (!current.active || !current.components[COMPONENTS.TRANSFORM]?.changed){
                this.changed.set(current.id, false)
                continue
            }
            this.changed.set(current.id, true)
            this.transform(current, current.components[COMPONENTS.TRANSFORM])
        }
    }
    transform(current, component){
        component.changed = false
        Transformation.transform(component.translation, component.rotationQuat, component.scaling, current.components[COMPONENTS.TRANSFORM].transformationMatrix)

        if (current.components[COMPONENTS.COLLIDER]) {
            switch (current.components[COMPONENTS.COLLIDER].axis) {
            case "x":
                if (component.scaling[0] > 1)
                    current.components[COMPONENTS.COLLIDER].radius *= component.scaling[0]
                break
            case "y":
                if (component.scaling[1] > 1)
                    current.components[COMPONENTS.COLLIDER].radius *= component.scaling[1]
                break
            case "z":
                if (component.scaling[2] > 1)
                    current.components[COMPONENTS.COLLIDER].radius *= component.scaling[2]
                break
            }
        }


        if (current.parent && current.parent.components[COMPONENTS.TRANSFORM])
            mat4.multiply(
                component.transformationMatrix,
                current.parent.components[COMPONENTS.TRANSFORM].transformationMatrix,
                component.transformationMatrix
            )

        const children = current.children
        for (let j = 0; j < children.length; j++) {
            if(children[j].components[COMPONENTS.TRANSFORM])
                this.transform(children[j], children[j].components[COMPONENTS.TRANSFORM])
        }
        component.changed = false
        if (current.components[COMPONENTS.MESH] !== undefined)
            current.components[COMPONENTS.MESH].normalMatrix = linearAlgebraMath.normalMatrix(current.components[COMPONENTS.TRANSFORM].transformationMatrix)
    }
}
