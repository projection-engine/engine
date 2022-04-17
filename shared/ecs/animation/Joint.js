import {mat4} from "gl-matrix";
import {v4 as uuidv4} from 'uuid';

export default class Joint {
    id
    childJoints = []
    transform = mat4.create()

    constructor(id = uuidv4()) {
        this.id = id
    }
}