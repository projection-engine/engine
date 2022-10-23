import ConversionAPI from "../math/ConversionAPI";
import DepthPass from "../../passes/DepthPass";

export default class PickingAPI {
    static readBlock(start, end) {
        const w = Math.round(Math.abs(start.x - end.x))
        const h = Math.round(Math.abs(start.y - end.y))
        gpu.bindFramebuffer(gpu.FRAMEBUFFER, DepthPass.framebuffer.FBO)
        gpu.readBuffer(gpu.COLOR_ATTACHMENT0 + 1)
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

    static readUV(x, y, imageWidth, imageHeight) {
        const w = window.gpu.canvas.width, h = window.gpu.canvas.height
        const coords = ConversionAPI.toQuadCoord({x, y}, {w, h})
        const uv = PickingAPI.readPixels(DepthPass.framebuffer.FBO, 2, coords)
        const texCoords = {
            x: (uv[0] * imageWidth) -0.5,
            y: (uv[1] * imageHeight) -0.5,
        }
        return {
            uv,
            texCoords
        }
    }

    static readEntityID(x, y) {
        const w = window.gpu.canvas.width, h = window.gpu.canvas.height
        const coords = ConversionAPI.toQuadCoord({x, y}, {w, h})
        const picked = PickingAPI.readPixels(DepthPass.framebuffer.FBO, 1, coords)

        return Math.round((picked[0] + picked[1] + picked[2]) * 255)
    }


}