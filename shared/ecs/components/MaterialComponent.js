import Component from "../basic/Component";

export default class MaterialComponent extends Component{
    materialID

    // OLD
    tiling = [1,1]
    overrideMaterial = false
    discardOffPixels = false
    radius = 50
    parallaxHeightScale = .1
    parallaxLayers = 32
    // OLD


    _uniforms = []
    uniformValues = {}

    constructor(id, materialID, overrideInjection) {
        super(id, MaterialComponent.name);
        this.materialID = materialID
        this.overrideInjection = overrideInjection
    }

    set uniforms(data){
        if(typeof data === 'object')
            this._uniforms = data
    }
    get uniforms(){
        return this._uniforms
    }
}