import Component from "../basic/Component";

export default class MaterialComponent extends Component{
    materialID

    overrideMaterial = false
    radius = 50
    doubleSided = true

    irradiance = []
    cubeMap = {}

     uniforms = []
    uniformValues = {}
    irradianceMultiplier = [1, 1, 1]
    constructor(id, materialID) {
        super(id, MaterialComponent.name);
        this.materialID = materialID
    }


}