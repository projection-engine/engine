import Light from "./Light";

export default class PointLight extends Light{
    constructor(gpu, ambientColor,  attenuation=[1,0,0],position=[0, 0, 0], name='New point light', active=false) {
        super(gpu, ambientColor, undefined, undefined, name);

        this.attenuation = attenuation
        this.position = position

        this.active = active
    }
}