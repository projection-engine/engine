import Component from "../basic/Component";
import {mat4} from "gl-matrix";

export default class CubeMapComponent extends Component {

    _position = [0, 0, 0]
    _res = 128
    _cubeMap
    _transformationMatrix = Array.from(mat4.create())
    _compiled = false
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
        this._compiled = false
    }

    get cubeMap() {
        return this._cubeMap
    }
    set cubeMap(data){
        this._cubeMap = data
    }

    get prefilteredMap() {
        return this._cubeMap?.prefiltered
    }

    get irradianceMap() {
        return this._cubeMap?.irradianceTexture
    }

    get compiled() {
        return this._compiled
    }
    set compiled(data){
        this._compiled = data && this._cubeMap
    }

    get prefilteredMipmaps() {
        return this._prefilteredMipmaps
    }
    set prefilteredMipmaps(data){
        this._prefilteredMipmaps = data
        this._compiled = false
    }

    get irradiance() {
        return this._irradiance
    }
    set irradiance(data){
        this._irradiance = data
        this._compiled = false
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