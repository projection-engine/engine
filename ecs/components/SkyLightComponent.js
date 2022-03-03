import Component from "../basic/Component";
import {mat4} from "gl-matrix";
import DirectionalLightComponent from "./DirectionalLightComponent";

export default class SkylightComponent extends DirectionalLightComponent {
    _rsmResolution = 512
    _lvpSamples = 32

    constructor(id) {
        super(id);
        this.name = 'SkylightComponent'
    }

    get rsmResolution(){
        return this._rsmResolution
    }
    set rsmResolution(data){
        this._rsmResolution = data
    }
    get lvpSamples(){
        return this._lvpSamples
    }
    set lvpSamples(data){
        this._lvpSamples = data
    }

}