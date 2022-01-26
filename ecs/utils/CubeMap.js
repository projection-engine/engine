import {mat4} from "gl-matrix";
import {createVBO, lookAt} from "../../utils/utils";
import skyBoxCube from "../../assets/meshes/cube";

export default class CubeMap {
    texture
    gpu
    onBeforeDraw
    _shader
    _res
    _position = [0, 0, 0]

    constructor(shader, gpu, res, onBeforeDraw, position) {
        this.gpu = gpu
        this.onBeforeDraw = onBeforeDraw
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, null)
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null)

        if(position)
            this._position = position
        this._vertexBuffer = createVBO(this.gpu, this.gpu.ARRAY_BUFFER, new Float32Array(skyBoxCube))

        this._res = res
        this.shader = shader
    }

    set position(data) {
        this._position = data
        this._createCubeMap()
    }

    get position() {
        return this._position
    }

    set res(data) {
        this._res = data
        this._createCubeMap()
    }

    set shader(data) {
        this._shader = data
        this._createCubeMap()
    }

    get shader() {
        return this._shader
    }

    static getRotations(index) {
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

    _createCubeMap() {
        let perspective = mat4.create()
        mat4.perspective(perspective, 1.57, 1, .1, 10)
        this.gpu.viewport(0, 0, this._res, this._res)

        let FBOs = [];
        let RBOs = [];
        this.texture = this.gpu.createTexture();
        this.gpu.bindTexture(this.gpu.TEXTURE_CUBE_MAP, this.texture);

        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MAG_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_MIN_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_CUBE_MAP, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);
        for (let i = 0; i < 6; i++) {+
            this.gpu.texImage2D(
                this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i,
                0,
                this.gpu.RGBA16F,
                this._res,
                this._res,
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
            this.gpu.renderbufferStorage(this.gpu.RENDERBUFFER, this.gpu.DEPTH_COMPONENT16, this._res, this._res);
            this.gpu.framebufferRenderbuffer(this.gpu.FRAMEBUFFER, this.gpu.DEPTH_ATTACHMENT, this.gpu.RENDERBUFFER, RBOs[i]);
            this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, null);

            // Attach one face of cube map
            this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0, this.gpu.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.texture, 0);

            let status_code = this.gpu.checkFramebufferStatus(this.gpu.FRAMEBUFFER);
            if (status_code === this.gpu.FRAMEBUFFER_COMPLETE) {
                this._shader.use()

                this.onBeforeDraw(this)
                this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);

                const rotations = CubeMap.getRotations(i)
                this._drawToTexture(perspective, lookAt(rotations.yaw, rotations.pitch, this._position))
            }
        }

    }

    _drawToTexture(projectionMatrix, staticViewMatrix) {

        this._shader.use()

        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)
        this.gpu.enableVertexAttribArray(this._shader.positionLocation)
        this.gpu.vertexAttribPointer(this._shader.positionLocation, 3, this.gpu.FLOAT, false, 0, 0)
        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, this._vertexBuffer)

        this.gpu.uniformMatrix4fv(this._shader.viewMatrixULocation, false, staticViewMatrix)
        this.gpu.uniformMatrix4fv(this._shader.projectionMatrixULocation, false, projectionMatrix)

        this.gpu.drawArrays(this.gpu.TRIANGLES, 0, 36)

        this.gpu.bindBuffer(this.gpu.ARRAY_BUFFER, null)
    }
}