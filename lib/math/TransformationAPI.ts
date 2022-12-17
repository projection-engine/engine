import {glMatrix, mat3, mat4, quat, vec2, vec3, vec4} from "gl-matrix"
import Movable from "../../instances/Movable";
import Entity from "../../instances/Entity";


export default class TransformationAPI {
    static utils = glMatrix
    static mat4 = mat4
    static mat3 = mat3
    static quat = quat
    static vec3 = vec3
    static vec2 = vec2
    static vec4 = vec4

    static transformMovable(movable:Movable|Entity):void {
        const translation = movable._translation
        const rotate = movable._rotationQuat
        const scale = movable._scaling
        const matrix = movable.matrix
        quat.normalize(cacheVec4, <quat>rotate)
        mat4.fromRotationTranslationScale(matrix, cacheVec4, <vec3>translation, <vec3>scale)
    }




}