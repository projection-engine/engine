import {mat4} from "gl-matrix";
import CubeMapShader from "../../renderer/shaders/skybox/CubeMapShader";
import {bindTexture, createTexture, createVBO, lookAt} from "../../utils/utils";
import skyBoxCube from "../../assets/meshes/cube";
import Component from "../basic/Component";
import HDRImage from 'hdrpng/hdrpng'

export default class SkyboxComponent extends Component{
    _hdrTexture
    _cubeMap
    _irradianceMap
    _initialized = false

    _imageID = undefined;

    constructor(id,gpu) {
        super(id, 'SkyboxComponent' );
        this.gpu = gpu
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)


        this._vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(skyBoxCube))

    }

    get imageID(){
        return this._imageID
    }

    set hdrTexture({blob, imageID, type}) {

        this.type = type
        this._imageID = imageID
        const baseShader = new CubeMapShader(this.gpu)
        const irradianceShader = new CubeMapShader(this.gpu, true)

        this._initializeTexture(blob, () => {
            this._cubeMap = this._createCubeMap(baseShader, 512)
            this._irradianceMap = this._createCubeMap(irradianceShader, 32, true)
            this._initialized = true
        })
    }



    get cubeMap() {
        return this._cubeMap
    }

    get irradianceMap() {
        return this._irradianceMap
    }

    _getRotations(index) {
        switch (index) {
            case 0:
                return {
                    yaw: 1.57,
                    pitch: 0,
                }
            case 1:
                return {
                    yaw: -1.57,
                    pitch: 0,
                }
            case 2:
                return {
                    yaw: Math.PI,
                    pitch: -1.57,
                }
            case 3:
                return {
                    yaw: Math.PI,
                    pitch: 1.57,
                }
            case 4:
                return {
                    yaw: Math.PI,
                    pitch: 0,
                }
            case 5:
                return {
                    yaw: 0,
                    pitch: 0,
                }
            default :
                return {
                    yaw: 0,
                    pitch: 0,
                }
        }
    }
    _createCubeMap(shader, res, asIrradiance) {
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)
        this.gpu.viewport(0, 0, res, res)

        let FBOs = [];
        let RBOs = [];
        let texture = this.gpu.createTexture();
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, texture);

        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MAG_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MIN_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        for (let i = 0; i < 6; i++) {
            this.gpu.texImage2D(
                this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0,
                this.gpu.RGBA16F,
                res,
                res,
                0,
                this.gpu.RGBA,
                this.gpu.FLOAT,
                null);
        }

        for (let i = 0; i < 6; i++) {
            // Create framebuffer
            FBOs[i] = this.gpu.createFramebuffer();
            this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, FBOs[i]);
            // Create and attach depth buffer
            RBOs[i] = this.gpu.createRenderbuffer();
            this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, RBOs[i]);
            this.gpu.renderbufferStorage(this.gpu.RENDERBUFFER, this.gpu.DEPTH_COMPONENT16, res, res);
            this.gpu.framebufferRenderbuffer(this.gpu.FRAMEBUFFER, this.gpu.DEPTH_ATTACHMENT, this.gpu.RENDERBUFFER, RBOs[i]);
            this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null);

            // Attach one face of cube map
            this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0, this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i, texture, 0);
            let status_code = this.gpu.checkFramebufferStatus(this.gpu.FRAMEBUFFER);
            if (status_code === this.gpu.FRAMEBUFFER_COMPLETE) {
                shader.use()

                if (!asIrradiance) {
                    this.gpu.activeTexture(this.gpu.TEXTURE0)

                    this.gpu.bindTexture(this.gpu.TEXTURE_2D, this._hdrTexture)
                    this.gpu.uniform1i(shader.equirectangularMapULocation, 0)
                } else {
                    this.gpu.activeTexture(this.gpu.TEXTURE0)
                    this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this._cubeMap)
                    this.gpu.uniform1i(shader.equirectangularMapULocation, 0)
                }
                this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);

                const rotations = this._getRotations(i)
                this.draw(shader, perspective, lookAt(rotations.yaw, rotations.pitch, [0, 0, 0]), true)
            }
        }
        return texture
    }


    _initializeTexture(hdrSrc, callback) {
        if(     this.type === 'hdr'){
            const img = new HDRImage()
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
            }
        }
        else {
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
            }
        }
    }


    draw(shader, projectionMatrix, staticViewMatrix, cubeMapStartup = false) {
        if(this._initialized || cubeMapStartup) {
            shader.use()

            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)
            this.gpu.enableVertexAttribArray(shader.positionLocation)
            this.gpu.vertexAttribPointer(shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)

            if (!cubeMapStartup) {
                this.gpu.activeTexture(this.gpu.TEXTURE0)
                this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this._cubeMap)
                this.gpu.uniform1i(shader.textureULocation, 0)
            }


            this.gpu.uniformMatrix4fv(shader.viewMatrixULocation, false, staticViewMatrix)
            this.gpu.uniformMatrix4fv(shader.projectionMatrixULocation, false, projectionMatrix)

            this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)

            this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)
        }
    }
}