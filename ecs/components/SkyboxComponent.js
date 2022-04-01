import {createTexture, lookAt} from "../../utils/misc/utils";
import Component from "../basic/Component";
import CubeMapInstance from "../../instances/CubeMapInstance";
import Shader from "../../utils/workers/Shader";
import * as shaderCode from "../../shaders/misc/cubeMap.glsl";
import * as skyboxCode from "../../shaders/misc/skybox.glsl";

export default class SkyboxComponent extends Component {
    __hdrTexture
    __cubeMap

    __initialized = false
    _resolution = 512
    _gamma = 1
    _exposure = 1
    imageID = undefined
    _prefilteredMipmaps = 6
    constructor(id, gpu) {
        super(id, 'SkyboxComponent');
        this.__gpu = gpu

        this.__cubeMap = new CubeMapInstance(gpu, this._resolution)

    }

    get resolution() {
        return this._resolution
    }

    set resolution(data) {
        this._resolution = data
        this._compile()
    }

    set hdrTexture({blob, imageID}) {
        this.imageID = imageID
        this.__hdrTexture = createTexture(
            this.__gpu,
            blob.naturalWidth,
            blob.naturalHeight,
            this.__gpu.RGB16F,
            0,
            this.__gpu.RGB,
            this.__gpu.FLOAT,
            blob,
            this.__gpu.LINEAR,
            this.__gpu.LINEAR,
            this.__gpu.CLAMP_TO_EDGE,
            this.__gpu.CLAMP_TO_EDGE
        )

        this._compile()
    }
    set gamma (data){
      this._gamma = data
    }
    set exposure (data){
        this._exposure = data
    }

    get gamma (){
        return this._gamma
    }
    get exposure (){
        return this._exposure
    }

    get ready() {
        return this.__initialized
    }

    get cubeMapPrefiltered() {
        return this.__cubeMap?.prefiltered
    }

    get cubeMap() {
        return this.__cubeMap?.texture
    }

    get irradianceMap() {
        return this.__cubeMap?.irradianceTexture
    }
    get prefilteredMipmaps(){
     return this._prefilteredMipmaps
    }
    set prefilteredMipmaps(_){}

    _compile() {
        this.__initialized = false
        const baseShader = new Shader(shaderCode.vertex, skyboxCode.generationFragment, this.__gpu)

        baseShader.use()
        this.__cubeMap.resolution = this._resolution
        this.__cubeMap.draw((yaw, pitch, perspective) => {
            baseShader.bindForUse({
                projectionMatrix: perspective,
                viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                uSampler: this.__hdrTexture
            })
            this.__gpu.drawArrays(this.__gpu.TRIANGLES, 0, 36)
        }, true)

        this.__cubeMap.generateIrradiance()
        this.__cubeMap.generatePrefiltered(this._prefilteredMipmaps, this._resolution/this._prefilteredMipmaps)
        this.__initialized = true
    }
}