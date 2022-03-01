import CubeMapShader from "../../shaders/classes/misc/CubeMapShader";
import {createTexture} from "../../utils/misc/utils";
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


        this._vertexBuffer = new VBO(gpu, 1, new Float32Array(cube), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)

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


    get cubeMapPrefiltered() {
        return this._cubeMap?.prefiltered
    }

    get cubeMap() {
        return this._cubeMap?.texture
    }

    get irradianceMap() {
        return this._irradianceMap?.texture
    }

    draw(shader, projectionMatrix, staticViewMatrix) {

        if (this._initialized) {
            shader.use()

            this._vertexBuffer.enable()
            this.gpu.activeTexture(this.gpu.TEXTURE0)
            this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.cubeMap)
            this.gpu.uniform1i(shader.textureULocation, 0)

            this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
            this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)
            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)
        }
    }
}