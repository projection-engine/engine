import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import DirectionalLightComponent from "./DirectionalLightComponent";

export default class SkylightComponent extends DirectionalLightComponent {
    rsmResolution = 512
    samples = 32
    indirectAttenuation = 1

    constructor(id) {
        super(id);
        this.name = 'SkylightComponent'
    }
    get attenuation(){
        return this.indirectAttenuation

    }
    get lpvSamples(){
        return this.samples

    }
    set attenuation(data){
        this.indirectAttenuation = data
        this._changed = true
    }
    set lpvSamples(data){
        this.samples = data
        this._changed = true
    }

}