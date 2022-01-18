import Light from "../entities/Light";
import {mat4} from "gl-matrix";

export default class DirectionalLight extends Light {
    lightView = []
    lightProjection = []
    shadowCasting = true

    constructor(gpu, ambientColor, diffuse, specular, direction, zNear, zFar) {

        super(gpu, ambientColor, diffuse, specular, 'New directional light');
        this.direction = direction
        this.zNear = zNear
        this.zFar = zFar

        this.gpu = gpu
        this.update()

    }

    update() {
        mat4.lookAt(this.lightView, this.direction, [0, 0, 0], [0, 1, 0])

        this.lightProjection = mat4.create();
        mat4.ortho(this.lightProjection, -35, 35, -35, 35, this.zNear, this.zFar);
        this.position = this.direction
    }
}