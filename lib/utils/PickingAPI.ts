import ConversionAPI from "../math/ConversionAPI";
import GPU from "../GPU";
import STATIC_FRAMEBUFFERS from "../../static/resources/STATIC_FRAMEBUFFERS";

export default class PickingAPI {
    static readBlock(start, end) {
        const w = Math.round(Math.abs(start.x - end.x))
        const h = Math.round(Math.abs(start.y - end.y))
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER).FBO)
        gpu.readBuffer(gpu.COLOR_ATTACHMENT1)
        let dd = new Float32Array(w * h * 4)
        gpu.readPixels(
            end.x > start.x ? start.x : end.x,
            end.y > start.y ? start.y : end.y,
            w,
            h,
            gpu.RGBA,
            gpu.FLOAT,
            dd
        )
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)

        return dd
    }

    static readPixels(framebuffer, attachment = 0, coords) {
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, framebuffer)
        gpu.readBuffer(gpu.COLOR_ATTACHMENT0 + attachment)
        let dd = new Float32Array(4)
        gpu.readPixels(
            coords.x,
            coords.y,
            1,
            1,
            window.gpu.RGBA,
            window.gpu.FLOAT,
            dd
        )
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, null)
        return dd
    }


    static readEntityID(x, y) {
        const w = window.GPUCanvas.width, h = window.GPUCanvas.height
        const coords = ConversionAPI.toQuadCoord({x, y}, {w, h})
        const picked = PickingAPI.readPixels(GPU.frameBuffers.get(STATIC_FRAMEBUFFERS.VISIBILITY_BUFFER).FBO, 1, coords)

        return Math.round(( picked[0] +picked[1] + picked[2]) * 255)
    }


}