import {mat4, quat} from "gl-matrix";
import {ENTITY_ACTIONS} from "../../../utils/entityReducer";
import COMPONENTS from "../../templates/COMPONENTS";

const toDeg = 57.2957795131

export default class Transformation {
    static transform(translation, rotate, scale) {
        const quaternion = rotate.length > 3 ? rotate : quat.fromEuler([], rotate[0] * toDeg, rotate[1] * toDeg, rotate[2] * toDeg)
        return mat4.fromRotationTranslationScale([], quaternion, translation, scale)
    }

    static extractTransformations(mat) {
        return {
            translation: mat4.getTranslation([], mat),
            rotationQuat: quat.normalize([], mat4.getRotation([], mat)),
            scaling: mat4.getScaling([], mat)
        }
    }


    static getEuler(q) {
        const angles = []

        const sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
        const cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
        angles[0] = Math.atan2(sinr_cosp, cosr_cosp);

        const sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
        if (Math.abs(sinp) >= 1)
            angles[1] = 3.14 * sinp / Math.abs(sinp)
        else
            angles[1] = Math.asin(sinp);

        const siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
        const cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
        angles[2] = Math.atan2(siny_cosp, cosy_cosp);

        return angles
    }

    static updateTransform(axis, data, key, engine, entityID, setAlert) {

        const entity = engine.entities.find(e => e.id === entityID)

        const component = entity.components.TransformComponent
        const prev = component[key]
        component[key] = [
            axis === 'x' ? data : prev[0],
            axis === 'y' ? data : prev[1],
            axis === 'z' ? data : prev[2]
        ]

        if (entity.components.PointLightComponent)
            entity.components.PointLightComponent.changed = true
        if (entity.components.CubeMapComponent)
            setAlert({message: 'Reflection captures need to be rebuilt', type: 'alert'})
        engine.dispatchEntities({
            type: ENTITY_ACTIONS.UPDATE_COMPONENT, payload: {
                entityID,
                key: COMPONENTS.TRANSFORM,
                data: component
            }
        })
    }
}