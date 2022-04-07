import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import {lookAt} from "../../utils/misc/utils";

export default class CameraComponent extends Component {
    fov = 1.57
    aspectRatio = 1
    zFar = 10000
    zNear = .1
    constructor(id) {
        super(id);
    }
}