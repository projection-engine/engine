import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS"
import TEXTURE_WRAPPING from "../static/texture/TEXTURE_WRAPPING";
import TEXTURE_FILTERING from "../static/texture/TEXTURE_FILTERING";
import TEXTURE_FORMATS from "../static/texture/TEXTURE_FORMATS";
import ImageProcessor from "../lib/math/ImageProcessor";

interface TextureAttributes {
    img?: string | ImageBitmap | HTMLImageElement
    wrapS?: string
    wrapT?: string
    minFilter?: string
    magFilter?: string

    internalFormat?: string
    format?: string
    width?: number
    height?: number
    type?: string
}

export default class Texture {
    loaded = false
    texture?: WebGLTexture
    attributes: TextureAttributes = {}

    async initialize(attributes: TextureAttributes) {
        const img = attributes.img
        this.attributes = attributes
        if (typeof img === "string") {
            if (img.includes("data:image/")) {
                this.attributes.img = <ImageBitmap | undefined>await ImageProcessor.request(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: img})
                this.texture = this.#initializeTexture()
            } else {
                const i = new Image()
                i.src = img
                await i.decode()
                this.attributes.img = i
                i.height = i.naturalHeight
                i.width = i.naturalWidth
                this.texture = this.#initializeTexture()
            }
        } else
            this.texture = this.#initializeTexture()
        this.loaded = true
        this.attributes = {}
    }

    #initializeTexture(): WebGLTexture | undefined {
        const {
            img,
            wrapS = TEXTURE_WRAPPING.REPEAT,
            wrapT = TEXTURE_WRAPPING.REPEAT,
            minFilter = TEXTURE_FILTERING.MIN.LINEAR_MIPMAP_LINEAR,
            magFilter = TEXTURE_FILTERING.MAG.LINEAR,
            internalFormat = TEXTURE_FORMATS.SRGBA.internalFormat,
            format = TEXTURE_FORMATS.SRGBA.format,
            width,
            height,
            type
        } = this.attributes

        if (!img)
            return

        const newTexture = Texture.createTexture(
            width,
            height,
            gpu[internalFormat],
            0,
            gpu[format],
            gpu[type],
            <ImageBitmap | HTMLImageElement>img,
            gpu[minFilter],
            gpu[magFilter],
            gpu[wrapS],
            gpu[wrapT],
            false,
            false
        )

        if (minFilter === TEXTURE_FILTERING.MIN.LINEAR_MIPMAP_LINEAR) {
            const anisotropicEXT = gpu.getExtension("EXT_texture_filter_anisotropic")
            const anisotropicAmountMin = 8
            const anisotropicAmount = Math.min(anisotropicAmountMin, gpu.getParameter(anisotropicEXT.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
            gpu.texParameterf(gpu.TEXTURE_2D, anisotropicEXT.TEXTURE_MAX_ANISOTROPY_EXT, anisotropicAmount)
            gpu.generateMipmap(gpu.TEXTURE_2D)
        }

        gpu.bindTexture(gpu.TEXTURE_2D, null)
        return newTexture
    }

    update(newImage: string) {
        if (this.loaded) {
            gpu.deleteTexture(this.texture)
            ImageProcessor.request(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: newImage})
                .then(res => {
                    this.attributes.img = <ImageBitmap | undefined>res
                    this.#initializeTexture()
                })
        }
    }

    static createTexture(
        width: number,
        height: number,
        internalFormat: number,
        border: number,
        format: number,
        type: number,
        data: null | HTMLImageElement | ImageBitmap,
        minFilter: number,
        magFilter: number,
        wrapS: number,
        wrapT: number,
        yFlip: boolean,
        autoUnbind = true
    ): WebGLTexture {
        const texture = gpu.createTexture()

        gpu.bindTexture(gpu.TEXTURE_2D, texture)
        gpu.texImage2D(gpu.TEXTURE_2D, 0, internalFormat, width, height, border, format, type, data)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, magFilter)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, minFilter)

        if (wrapS !== undefined)
            gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, wrapS)
        if (wrapT !== undefined)
            gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, wrapT)
        if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, false)
        if (autoUnbind)
            gpu.bindTexture(gpu.TEXTURE_2D, null)

        return texture
    }

}
