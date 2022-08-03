import * as shaderCode from "../data/shaders/PICK.glsl"
import ShaderInstance from "../libs/instances/ShaderInstance"
import FramebufferInstance from "../libs/instances/FramebufferInstance"
import {mat4} from "gl-matrix"


export default class ViewportPicker {
    static readBlock(depthFBO, start, end) {
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

    static depthPick(depthFBO, coords) {
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

}