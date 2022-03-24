import {mat4, quat} from "gl-matrix";
import {ENTITY_ACTIONS} from "../../../utils/entityReducer";

const toDeg = 57.2957795131

export default class Transformation {
    static transform(translation, rotate, scale, rotationType) {
        const quaternion = rotate.length > 3 ? rotate : quat.fromEuler([], rotate[0] * toDeg, rotate[1] * toDeg, rotate[2] * toDeg)
        // const center = rotationType === ROTATION_TYPES.GLOBAL? [0, 0, 0] : translation


        //
        // if(rotationType === ROTATION_TYPES.GLOBAL)
        //     mat4.multiply(res, t, r)
        // else
        //     mat4.multiply(res, r, t)
        // mat4.multiply(res, res, s)
        //

        return mat4.fromRotationTranslationScale([], quaternion, translation, scale)
    }

    static extractTransformations(mat) {
        return {
            translation: mat4.getTranslation([], mat),
            rotation: Transformation.getEuler(mat4.getRotation([], mat)),
            scaling: mat4.getScaling([], mat)
        }
    }


    static getEuler(q) {
        const angles = []

        // roll (x-axis rotation)
        const sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
        const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
        angles[0] = Math.atan2(sinr_cosp, cosr_cosp);

        // pitch (y-axis rotation)
        const sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
        if (Math.abs(sinp) >= 1)
            angles[1] = 3.14 * sinp / Math.abs(sinp) // use 90 degrees if out of range
        else
            angles[1] = Math.asin(sinp);

        // yaw (z-axis rotation)
        const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
        const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
        angles[2] = Math.atan2(siny_cosp, cosy_cosp);

        return angles
    }

    static updateTransform(axis, data, key, engine, entityID) {
        const entity = engine.entities.find(e => e.id === entityID)

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