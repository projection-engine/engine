import {mat4} from "gl-matrix";
import randomID from "../../../pages/project/utils/misc/randomID";


export default class Joint {
    id
    childJoints = []
    transform = mat4.create()

    constructor(id = randomID()) {
        this.id = id
    }
}