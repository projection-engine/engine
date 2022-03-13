import Component from "../basic/Component";

export default class MaterialComponent extends Component{
    materialID
    tiling = [1,1]
    overrideTiling = false
    discardOffPixels = false
    constructor(id, materialID, overrideInjection) {
        super(id, MaterialComponent.constructor.name);
        this.materialID = materialID
        this.overrideInjection = overrideInjection
    }
}