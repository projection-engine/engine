import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class CubeMapComponent extends Component {

    _position = [0, 0, 0]
    _res = 128
    __cubeMap
    _transformationMatrix = Array.from(mat4.create())
    __compiled = false
    _irradiance = true
    _prefilteredMipmaps = 6

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

    get compiled() {

        return this.__compiled
    }
    set compiled(data){

        this.__compiled = data
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

    get position() {
        return this._position
    }
    set position(data) {
        this._position = data

        this._transformationMatrix[12] = data[0]
        this._transformationMatrix[13] = data[1]
        this._transformationMatrix[14] = data[2]
    }


    get transformationMatrix() {
        return this._transformationMatrix
    }

}