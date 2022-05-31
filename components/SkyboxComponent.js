import Component from "../basic/Component"

export default class SkyboxComponent extends Component {
    __cubeMap
    __initialized = false
    _resolution = 512
    // _gamma = 1
    // _exposure = 1
    imageID = undefined
    _prefilteredMipmaps = 5

    constructor(id) {
        super(id, 'SkyboxComponent');
    }
    get blob (){
        return this.__blob
    }
    set blob(data){
        this.__blob = data
        this.__initialized = false
    }


    get resolution() {
        return this._resolution
    }

    set resolution(data) {
        this._resolution = data
        this.__initialized = false
    }
    set ready(data) {
         this.__initialized = data
    }

    set gamma (data){
      this._gamma = data
    }
    set exposure (data){
        this._exposure = data
    }
    set prefilteredMipmaps(data){
        this._prefilteredMipmaps = data
    }

    set cubeMap(data){
        this.__cubeMap = data
    }

    get cubeMap(){
        return this.__cubeMap
    }
    get gamma (){
        return this._gamma
    }
    get exposure (){
        return this._exposure
    }
    get prefilteredMipmaps(){
        return this._prefilteredMipmaps
    }
    get ready() {
        return this.__initialized
    }

}