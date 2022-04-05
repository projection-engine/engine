import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import {lookAt} from "../../utils/misc/utils";

export default class CameraComponent extends Component {
    fov = 1.57
    aspectRatio = 1
    zNear = 10000
    zFar = -1
    constructor(id) {
        super(id);
    }
}