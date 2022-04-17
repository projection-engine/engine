import {WebWorker} from "../../../../pages/project/utils/workers/WebWorker";
import blendWithColor, {colorToImage, heightBasedLinearInterpolate, linearInterpolate} from "./functions/blend";

import resize, {extractChannel, getImageBitmap, invert} from "./functions/misc";

export const COLOR_BLEND_OPERATIONS = {
    ADD: 0,
    MULTIPLY: 1,
    POWER: 2,
    LERP: 3 // TODO
}
export default class ImageProcessor {
    static async getImageBitmap(base64){
        const w = new WebWorker()
        return await w.createExecution(base64, getImageBitmap.toString())
    }

    static noise(size) {
        let canvas = document.createElement("canvas");
        let w = canvas.width = size;
        let h = canvas.height = size;
        let context = canvas.getContext("2d");

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                let num = Math.floor(Math.random() * 2)
                context.fillStyle = "rgb(" + num + "," + num + "," + num + ")";
                context.fillRect(i, j, 1, 1);
            }
        }

        return canvas.toDataURL()
    }

    static getPixel(ctx, x, y) {
        const imgData = ctx.getImageData(x, y, 1, 1);
        return imgData.data;
    }

    static getContext(image) {
        const c = document.createElement("canvas");
        c.width = image.naturalWidth
        c.height = image.naturalHeight

        let ctx = c.getContext("2d");
        ctx.drawImage(image, 0, 0)

        return ctx
    }


    static async byChannels(channels, img) {
        const worker = new WebWorker()
        return await worker.createExecution({img, channels}, extractChannel.toString())
    }


    static async invert(img) {
        const worker = new WebWorker()
        return await worker.createExecution({img}, invert.toString())
    }

    static async heightBasedLinearInterpolate(img, img0, heightImg, f) {
        const worker = new WebWorker()
        return await worker.createExecution({img, img0, heightImg, f}, heightBasedLinearInterpolate.toString())
    }

    static async linearInterpolate(img, img0, factor) {
        const worker = new WebWorker()
        return await worker.createExecution({img, img0, factor}, linearInterpolate.toString())
    }

    static async colorToImage(color, resolution = 256) {
        const worker = new WebWorker()
        return await worker.createExecution({color, resolution}, colorToImage.toString())
    }
    static async resizeImage(src, w, h, sizePercent, quality = 1) {
        const worker = new WebWorker()
        return await worker.createExecution({src, w, h, sizePercent, quality}, resize.toString())
    }


    static async blendWithColor(src, color, operation) {
        const w = new WebWorker()
        return await w.createExecution({color, operation, src}, blendWithColor.toString())
    }
}

