import Component from "../basic/Component";

export default class MaterialComponent extends Component{
    materialID
    constructor(id, materialID, overrideInjection) {
        super(id, MaterialComponent.constructor.name);
        this.materialID = materialID
        this.overrideInjection = overrideInjection
    }
}