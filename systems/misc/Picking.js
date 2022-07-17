import * as shaderCode from "../../shaders/PICK.glsl"
import ShaderInstance from "../../instances/ShaderInstance"
import FramebufferInstance from "../../instances/FramebufferInstance"
import {mat4} from "gl-matrix"
import MeshInstance from "../../instances/MeshInstance"
import COMPONENTS from "../../data/COMPONENTS"


export default class Picking {
    constructor() {
        this.frameBuffer = new FramebufferInstance(1, 1)
            .texture({
                attachment: 0,
                linear: true,
                repeat: true,
                storage: false,
                precision: window.gpu.RGBA,
                format: window.gpu.RGBA,
                type: window.gpu.UNSIGNED_BYTE
            })
            .depthTest(window.gpu.DEPTH_COMPONENT16)
        this.shader = new ShaderInstance(shaderCode.vertex, shaderCode.fragment)
    }

    readBlock(depthFBO, start, end) {
        const w = Math.round(Math.abs(start.x - end.x))
        const h = Math.round(Math.abs(start.y - end.y))
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, depthFBO.FBO)
        let dd = new Float32Array(w * h * 4)

        window.gpu.readPixels(
            end.x > start.x ? start.x : end.x,
            end.y > start.y ? start.y : end.y,
            w,
            h,
            window.gpu.RGBA,
            window.gpu.FLOAT,
            dd
        )
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, null)

        return dd
    }

    depthPick(depthFBO, coords) {
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, depthFBO.FBO)
        let dd = new Float32Array(4)
        window.gpu.readPixels(
            coords.x,
            coords.y,
            1,
            1,
            window.gpu.RGBA,
            window.gpu.FLOAT,
            dd
        )
        window.gpu.bindFramebuffer(window.gpu.FRAMEBUFFER, null)
        return dd
    }

    pickElement(drawCallback, pickCoords, camera) {

        this.shader.use()
        this.frameBuffer.startMapping()

        const pickerProjection = this._getProjection(pickCoords, camera)
        drawCallback(this.shader, pickerProjection)
        let data = new Uint8Array(4)
        window.gpu.readPixels(
            0,
            0,
            1,
            1,
            window.gpu.RGBA,
            window.gpu.UNSIGNED_BYTE,
            data
        )

        this.frameBuffer.stopMapping()
        return data[0] + data[1] + data[2]
    }

    _getProjection({x, y}, camera) {
        let m = mat4.create()
        const aspect = camera.aspectRatio
        let top = Math.tan(camera.fov / 2) * camera.zNear,
            bottom = -top,
            left = aspect * bottom,
            right = aspect * top

        const width = Math.abs(right - left)
        const height = Math.abs(top - bottom)

        const pixelX = x * window.gpu.canvas.width / window.gpu.canvas.clientWidth
        const pixelY = window.gpu.canvas.height - y * window.gpu.canvas.height / window.gpu.canvas.clientHeight - 1

        const subLeft = left + pixelX * width / window.gpu.canvas.width
        const subBottom = bottom + pixelY * height / window.gpu.canvas.height
        const subWidth = 1 / window.gpu.canvas.width
        const subHeight = 1 / window.gpu.canvas.height

        mat4.frustum(
            m,
            subLeft,
            subLeft + subWidth,
            subBottom,
            subBottom + subHeight,
            camera.zNear,
            camera.zFar)

        return m
    }
}