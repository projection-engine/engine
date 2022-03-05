import CubeMapShader from "../../shaders/classes/misc/CubeMapShader";
import {createTexture, createVAO} from "../../utils/misc/utils";
import cube from "../../assets/cube.json";
import Component from "../basic/Component";
import CubeMapInstance from "../../elements/instances/CubeMapInstance";
import VBO from "../../utils/workers/VBO";

export default class SkyboxComponent extends Component {
    _hdrTexture
    _cubeMap
    _irradianceMap
    _initialized = false

    _imageID = undefined;

    constructor(id, gpu) {
        super(id, 'SkyboxComponent');
        this.gpu = gpu
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)
    }

    get imageID() {
        return this._imageID
    }

    set imageID(data) {
        this._imageID = data
    }

    set hdrTexture({blob, imageID}) {

        this._imageID = imageID
        const baseShader = new CubeMapShader(this.gpu, 0)
        const irradianceShader = new CubeMapShader(this.gpu, 1)

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

        this._cubeMap = new CubeMapInstance(baseShader, this.gpu, 1024, (c) => {
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

}