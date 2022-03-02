import {mat4, quat} from "gl-matrix";
import {ENTITY_ACTIONS} from "../../../utils/entityReducer";
import ROTATION_TYPES from "../misc/ROTATION_TYPES";

export default class Transformation {
    static transform(translation, rotate, scale, rotationType) {
        const t = Transformation.translate(translation),
            r = Transformation.rotate(rotate, rotationType),
            s = Transformation.scale(scale)
        const res = mat4.create()
        mat4.multiply(res, t, r)
        mat4.multiply(res, res, s)
        return Array.from(res)
    }

    static translate(translation) {
        const translationMatrix = mat4.create()
        mat4.translate(translationMatrix, translationMatrix, translation)
        return translationMatrix
    }

    static rotate(rotation, rotationType) {
        const rotationMatrix = mat4.create()

        if(rotationType === ROTATION_TYPES.RELATIVE) {
            mat4.rotate(
                rotationMatrix,
                rotationMatrix,
                rotation[0],
                [1, 0, 0]
            )
            mat4.rotate(
                rotationMatrix,
                rotationMatrix,
                rotation[1],
                [0, 1, 0]
            )
            mat4.rotate(
                rotationMatrix,
                rotationMatrix,
                rotation[2],
                [0, 0, 1]
            )
        }
        else{
            const quaternion = quat.create()
            quat.fromEuler(quaternion, rotation[0], rotation[1], rotation[2])
            mat4.fromQuat(rotationMatrix, quaternion)
        }


        return rotationMatrix
    }

    static scale(scaling) {
        const scalingMatrix = mat4.create()
        mat4.scale(scalingMatrix, scalingMatrix, scaling)

        return scalingMatrix
    }
    static updateTransform (axis, data, key, engine, entityID) {
        const entity  = engine.entities.find(e => e.id === entityID)

        const component = entity.components.TransformComponent
        const prev = component[key]
        component[key] = [
            axis === 'x' ? data : prev[0],
            axis === 'y' ? data : prev[1],
            axis === 'z' ? data : prev[2]
        ]
        engine.dispatchEntities({
            type: ENTITY_ACTIONS.UPDATE_COMPONENT, payload: {
                entityID,
                key: 'TransformComponent',
                data: component
            }
        })
    }
}