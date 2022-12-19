import ConversionAPI from "../math/ConversionAPI";
import GPU from "../../GPU";
import StaticFBOsController from "../StaticFBOsController";

export default class PickingAPI {
    static readBlock(start, end) {
        const w = Math.round(Math.abs(start.x - end.x))
        const h = Math.round(Math.abs(start.y - end.y))
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, StaticFBOsController.visibility.FBO)
        GPU.context.readBuffer(GPU.context.COLOR_ATTACHMENT1)
        let dd = new Float32Array(w * h * 4)
        GPU.context.readPixels(
            end.x > start.x ? start.x : end.x,
            end.y > start.y ? start.y : end.y,
            w,
            h,
            GPU.context.RGBA,
            GPU.context.FLOAT,
            dd
        )
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, null)

        return dd
    }

    static readPixels(framebuffer, attachment = 0, coords) {
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, framebuffer)
        GPU.context.readBuffer(GPU.context.COLOR_ATTACHMENT0 + attachment)
        let dd = new Float32Array(4)
        GPU.context.readPixels(
            coords.x,
            coords.y,
            1,
            1,
            GPU.context.RGBA,
            GPU.context.FLOAT,
            dd
        )
        GPU.context.bindFramebuffer(GPU.context.FRAMEBUFFER, null)
        return dd
    }


    static readEntityID(x, y) {
        const w = GPU.canvas.width, h = GPU.canvas.height
        const coords = ConversionAPI.toQuadCoord({x, y}, {w, h})
        const picked = PickingAPI.readPixels(StaticFBOsController.visibility.FBO, 1, coords)

        return Math.round(( picked[0] +picked[1] + picked[2]) * 255)
    }


}