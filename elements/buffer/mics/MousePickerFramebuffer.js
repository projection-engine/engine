import Framebuffer from "./Framebuffer";
import {mat4} from "gl-matrix";

export default class MousePickerFramebuffer extends Framebuffer {
    constructor(gpu) {
        super(gpu, 1, 1);

        this.frameBufferTexture = this.gpu.createTexture();
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.frameBufferTexture);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_MIN_FILTER, this.gpu.LINEAR);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_S, this.gpu.CLAMP_TO_EDGE);
        this.gpu.texParameteri(this.gpu.TEXTURE_2D, this.gpu.TEXTURE_WRAP_T, this.gpu.CLAMP_TO_EDGE);

        this.renderBufferObject = this.gpu.createRenderbuffer();
        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, this.renderBufferObject);
        this.gpu.bindTexture(this.gpu.TEXTURE_2D, this.frameBufferTexture);
        this.gpu.texImage2D(
            this.gpu.TEXTURE_2D,
            0,
            this.gpu.RGBA,
            1,
            1,
            0,
            this.gpu.RGBA,
            this.gpu.UNSIGNED_BYTE,
            null);
        this.frameBufferObject = this.gpu.createFramebuffer()
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.frameBufferObject)

        this.gpu.bindRenderbuffer(this.gpu.RENDERBUFFER, this.renderBufferObject);
        this.gpu.renderbufferStorage(this.gpu.RENDERBUFFER, this.gpu.DEPTH_COMPONENT16, 1, 1);
        this.gpu.framebufferTexture2D(this.gpu.FRAMEBUFFER, this.gpu.COLOR_ATTACHMENT0, this.gpu.TEXTURE_2D, this.frameBufferTexture, 0);

        this.gpu.framebufferRenderbuffer(this.gpu.FRAMEBUFFER, this.gpu.DEPTH_ATTACHMENT, this.gpu.RENDERBUFFER, this.renderBufferObject);

    }

    getProjection({x, y}, camera) {

        const aspect = camera.aspectRatio
        let top = Math.tan(camera.fov / 2) * camera.zNear,
            bottom = -top,
            left = aspect * bottom,
            right = aspect * top

        const width = Math.abs(right - left);
        const height = Math.abs(top - bottom);

        const pixelX = x * this.gpu.canvas.width / this.gpu.canvas.clientWidth;

        const pixelY = this.gpu.canvas.height - y * this.gpu.canvas.height / this.gpu.canvas.clientHeight - 1;

        const subLeft = left + pixelX * width / this.gpu.canvas.width;
        const subBottom = bottom + pixelY * height / this.gpu.canvas.height;
        const subWidth = 1 / this.gpu.canvas.width;
        const subHeight = 1 / this.gpu.canvas.height;

        let m = mat4.create()

        mat4.frustum(
            m,
            subLeft,
            subLeft + subWidth,
            subBottom,
            subBottom + subHeight,
            camera.zNear,
            camera.zFar);

        return  m
    }

    start() {
        this.gpu.bindFramebuffer(this.gpu.FRAMEBUFFER, this.frameBufferObject);

        this.gpu.viewport(0, 0, 1, 1)

        this.gpu.enable(this.gpu.CULL_FACE);
        this.gpu.enable(this.gpu.DEPTH_TEST);

        // Clear the canvas AND the depth buffer.
        this.gpu.clear(this.gpu.COLOR_BUFFER_BIT | this.gpu.DEPTH_BUFFER_BIT);

    }


    onBeforeDraw() {
        super.onBeforeDraw();
        this.gpu.viewport(0, 0, 1, 1)
    }
}