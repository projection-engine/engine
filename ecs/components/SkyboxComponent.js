import CubeMapShader from "../../shaders/classes/misc/CubeMapShader";
import {createTexture} from "../../utils/misc/utils";
import Component from "../basic/Component";
import CubeMapInstance from "../../elements/instances/CubeMapInstance";

export default class SkyboxComponent extends Component {
    _hdrTexture
    _cubeMap
    _irradianceMap
    _initialized = false
    _resolution = 512
    gamma =1
    exposure =1
    imageID = undefined

    constructor(id, gpu) {
        super(id, 'SkyboxComponent');
        this.gpu = gpu
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)
    }

    get resolution(){
        return this._resolution
    }

    set resolution(data){
        console.log(data)
        this._resolution = data
        this._compile()
    }

    set hdrTexture({blob, imageID}) {
        this.imageID = imageID
        this._hdrTexture = createTexture(
            this.gpu,
            blob.width,
            blob.height,
            this.gpu.RGB16F,
            0,
            this.gpu.RGB,
            this.gpu.FLOAT,
            blob,
            this.gpu.LINEAR,
            this.gpu.LINEAR,
            this.gpu.CLAMP_TO_EDGE,
            this.gpu.CLAMP_TO_EDGE
        )
        this._compile()
    }

    get ready(){
        return this._initialized
    }
    get cubeMapPrefiltered() {
        return this._cubeMap?.prefiltered
    }

    get cubeMap() {
        return this._cubeMap?.texture
    }

    get irradianceMap() {
        return this._irradianceMap?.texture
    }

    _compile( ){
        this._initialized = false
        const baseShader = new CubeMapShader(this.gpu, 0)
        const irradianceShader = new CubeMapShader(this.gpu, 1)

        this._cubeMap = new CubeMapInstance(baseShader, this.gpu, this._resolution, (c) => {
            this.gpu.activeTexture(this.gpu.TEXTURE0)
            this.gpu.bindTexture(this.gpu.TEXTURE_2D, this._hdrTexture)
            this.gpu.uniform1i(c.equirectangularMapULocation, 0)
        }, [0, 0, 0], true)
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
        this._irradianceMap = new CubeMapInstance(
            irradianceShader,
            this.gpu, 32, (c) => {
                this.gpu.activeTexture(this.gpu.TEXTURE0)
                this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this._cubeMap.texture)
                this.gpu.uniform1i(c.equirectangularMapULocation, 0)
            }, [0, 0, 0], false, true)
        this._initialized = true
    }
}