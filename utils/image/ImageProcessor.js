import {WebWorker} from "../WebWorker"
import blendWithColor, {colorToImage, heightBasedLinearInterpolate, linearInterpolate} from "./functions/blend"

import resize, {extractChannel, getImageBitmap, invert} from "./functions/misc"

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
    static checkerBoardTexture(){
        const SIZE = 1024,
            canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d")

        const QUANTITY = 12
        let lastRadius = 0

        canvas.width = SIZE
        canvas.height = SIZE

        ctx.lineWidth = 75
        for(let i = 0; i < QUANTITY; i++){
            const section = Math.PI * 2/QUANTITY
            ctx.strokeStyle = i%2 ?  "white" : "red"
            ctx.beginPath()
            ctx.arc(SIZE/2, SIZE/2 , SIZE/4, lastRadius, lastRadius + section)
            ctx.stroke()
            ctx.closePath()
            lastRadius += section
        }

        ctx.strokeStyle = "black"
        ctx.lineWidth = 25

        ctx.beginPath()
        ctx.moveTo(0,SIZE/2)
        ctx.lineTo( SIZE, SIZE/2)
        ctx.stroke()
        ctx.closePath()

        ctx.beginPath()
        ctx.moveTo(SIZE/2, 0)
        ctx.lineTo( SIZE/2 , SIZE)
        ctx.stroke()
        ctx.closePath()

        ctx.strokeStyle = "orange"
        ctx.fillStyle = "orange"

        ctx.beginPath()
        ctx.arc(SIZE/2, SIZE/2 , SIZE * .05, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()

        console.log(canvas.toDataURL())

        return canvas.toDataURL()
    }
    static noise(size) {
        let canvas = document.createElement("canvas")
        let w = canvas.width = size
        let h = canvas.height = size
        let context = canvas.getContext("2d")

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < h; j++) {
                let num = Math.floor(Math.random() * 2)
                context.fillStyle = "rgb(" + num + "," + num + "," + num + ")"
                context.fillRect(i, j, 1, 1)
            }
        }

        return canvas.toDataURL()
    }

    static getPixel(ctx, x, y) {
        const imgData = ctx.getImageData(x, y, 1, 1)
        return imgData.data
    }

    static getContext(image) {
        const c = document.createElement("canvas")
        c.width = image.naturalWidth
        c.height = image.naturalHeight

        let ctx = c.getContext("2d")
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

