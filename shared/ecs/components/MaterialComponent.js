import Component from "../basic/Component";

export default class MaterialComponent extends Component{
    materialID

    overrideMaterial = false
    radius = 50
    doubleSided = true


     uniforms = []
    uniformValues = {}

    constructor(id, materialID) {
        super(id, MaterialComponent.name);
        this.materialID = materialID
    }


}