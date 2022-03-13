import {createTexture, lookAt} from "../../utils/misc/utils";
import Component from "../basic/Component";
import CubeMapInstance from "../../instances/CubeMapInstance";
import Shader from "../../utils/workers/Shader";
import * as shaderCode from "../../shaders/misc/cubeMap.glsl";
import * as skyboxCode from "../../shaders/misc/skybox.glsl";

export default class SkyboxComponent extends Component {
    _hdrTexture
    _cubeMap
    _irradianceMap
    _initialized = false
    _resolution = 512
    gamma = 1
    exposure = 1
    imageID = undefined
    _prefilteredMipmaps = 6
    constructor(id, gpu) {
        super(id, 'SkyboxComponent');
        this.gpu = gpu

        this._cubeMap = new CubeMapInstance(gpu, this._resolution)

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
        this._hdrTexture = createTexture(
            this.gpu,
            blob.naturalWidth,
            blob.naturalHeight,
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

    get ready() {
        return this._initialized
    }

    get cubeMapPrefiltered() {
        return this._cubeMap?.prefiltered
    }

    get cubeMap() {
        return this._cubeMap?.texture
    }

    get irradianceMap() {
        return this._cubeMap?.irradianceTexture
    }
    get prefilteredMipmaps(){
     return this._prefilteredMipmaps
    }
    set prefilteredMipmaps(_){}

    _compile() {
        this._initialized = false
        const baseShader = new Shader(shaderCode.vertex, skyboxCode.generationFragment, this.gpu)

        baseShader.use()
        this._cubeMap.resolution = this._resolution
        this._cubeMap.draw((yaw, pitch, perspective) => {
            baseShader.bindForUse({
                projectionMatrix: perspective,
                viewMatrix: lookAt(yaw, pitch, [0, 0, 0]),
                uSampler: this._hdrTexture
            })
            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
        }, true)
        this._cubeMap.generateIrradiance()
        this._cubeMap.generatePrefiltered(this._prefilteredMipmaps, this._resolution/this._prefilteredMipmaps)
        this._initialized = true
    }
}