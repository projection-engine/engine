import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class CubeMapComponent extends Component {

    _res = 128
    __cubeMap
    _transformationMatrix = Array.from(mat4.create())

    _irradiance = true
    _prefilteredMipmaps = 6
    radius = 50

    constructor(id, resolution, position) {
        super(id, CubeMapComponent.constructor.name);
        if (resolution)
            this._resolution = resolution
        if (position)
            this.position = position
    }

    get resolution() {
        return this._res
    }

    set resolution(data) {
        this._res = data
    }

    get cubeMap() {
        return this.__cubeMap
    }
    set cubeMap(data){
        this.__cubeMap = data
    }

    get prefilteredMap() {
        return this.__cubeMap?.prefiltered
    }

    get irradianceMap() {
        return this.__cubeMap?.irradianceTexture
    }



    get prefilteredMipmaps() {
        return this._prefilteredMipmaps
    }
    set prefilteredMipmaps(data){
        this._prefilteredMipmaps = data
    }

    get irradiance() {
        return this._irradiance
    }
    set irradiance(data){
        this._irradiance = data
    }




    get transformationMatrix() {
        return this._transformationMatrix
    }

}