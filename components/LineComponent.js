import Component from "../basic/Component";
import {mat4, quat, vec3} from "gl-matrix";

export default class LineComponent extends Component {
    position = [0, 0, 0]
    transformationMatrix = mat4.create()
    _thickness = 1

    origin = [0, 0, 0]
    destination = [1, 1, 1]

    constructor(id) {
        super(id);
    }

    get thickness() {
        return this._thickness
    }

    set placement({origin, destination}) {
        const translation = origin
        const scaling = vec3.length(vec3.sub([], origin, destination))

        const angle = Math.acos(vec3.dot(origin, destination))
        const axis =  vec3.cross([],vec3.normalize([], origin), vec3.normalize([], destination))

        const rotationQuat = quat.fromEuler([], angle * axis[0], angle * axis[1], angle * axis[2])

        mat4.fromRotationTranslationScale(this.transformationMatrix, rotationQuat, translation, [scaling * axis[0], scaling * axis[1], scaling * axis[2]])
    }

    set thickness(data) {
        mat4.scale(this.transformationMatrix, data)
    }
}