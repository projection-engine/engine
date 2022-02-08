import CubeMapShader from "../../renderer/shaders/cubemap/CubeMapShader";
import {createTexture, createVBO} from "../../utils/utils";
import skyBoxCube from "../../assets/cube";
import Component from "../basic/Component";
import HDRImage from 'hdrpng/hdrpng'
import CubeMap from "../../renderer/elements/CubeMap";

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


        this._vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(skyBoxCube))

    }

    get imageID() {
        return this._imageID
    }

    set hdrTexture({blob, imageID}) {

        this._imageID = imageID
        const baseShader = new CubeMapShader(this.gpu, 0)
        const irradianceShader = new CubeMapShader(this.gpu, 1)

        this._initializeTexture(blob, () => {
            this._cubeMap = new CubeMap(baseShader, this.gpu, 512, (c) => {
                this.gpu.activeTexture(this.gpu.TEXTURE0)

                this.gpu.bindTexture(this.gpu.TEXTURE_2D, this._hdrTexture)
                this.gpu.uniform1i(c.equirectangularMapULocation, 0)
            }, [0,0,0], true)
            this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT)
            this._irradianceMap = new CubeMap(
                irradianceShader,
                this.gpu, 32, (c) => {
                this.gpu.activeTexture(this.gpu.TEXTURE0)
                this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this._cubeMap.texture)
                this.gpu.uniform1i(c.equirectangularMapULocation, 0)
            }, [0,0,0], false, true)

            this._initialized = true
        })
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

    _initializeTexture(hdrSrc, callback) {
        // if (this.type === 'hdr') {
        //     const img = new HDRImage()
        //     img.src = hdrSrc
        //     img.onload = () => {
        //         this._hdrTexture = createTexture(
        //             this.gpu,
        //             img.width,
        //             img.height,
        //             this.gpu.RGB16F,
        //             0,
        //             this.gpu.RGB,
        //             this.gpu.FLOAT,
        //             img,
        //             this.gpu.LINEAR,
        //             this.gpu.LINEAR,
        //             this.gpu.CLAMP_TO_EDGE,
        //             this.gpu.CLAMP_TO_EDGE
        //         )
        //
        //         callback()
        //     }
        // } else {
            const img = new Image()
            img.src = hdrSrc
            img.onload = () => {
                this._hdrTexture = createTexture(
                    this.gpu,
                    img.width,
                    img.height,
                    this.gpu.RGB16F,
                    0,
                    this.gpu.RGB,
                    this.gpu.FLOAT,
                    img,
                    this.gpu.LINEAR,
                    this.gpu.LINEAR,
                    this.gpu.CLAMP_TO_EDGE,
                    this.gpu.CLAMP_TO_EDGE
                )

                callback()
            // }
        }
    }


    draw(shader, projectionMatrix, staticViewMatrix) {

        if (this._initialized) {
            shader.use()

            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)
            this.gpu.enableVertexAttribArray(shader.positionLocation)
            this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)

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