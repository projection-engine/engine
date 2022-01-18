import Light from "../entities/Light";

export default class SpotLight extends Light {
    constructor(ambientColor, diffuse, specular, position, direction, cutoff, name='New spotlight', active=false) {
        super(ambientColor, diffuse, specular, name);

        this.position = position
        this.direction = direction
        this.cutoff = cutoff
        this.active = active
    }
}