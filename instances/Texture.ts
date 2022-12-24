import IMAGE_WORKER_ACTIONS from "../static/IMAGE_WORKER_ACTIONS"
import TEXTURE_WRAPPING from "../static/texture/TEXTURE_WRAPPING";
import TEXTURE_FILTERING from "../static/texture/TEXTURE_FILTERING";
import TEXTURE_FORMATS from "../static/texture/TEXTURE_FORMATS";
import ImageProcessor from "../lib/math/ImageProcessor";
import GPU from "../GPU";
import TextureParams from "../templates/TextureParams";


export default class Texture {
    loaded = false
    texture?: WebGLTexture
    attributes: TextureParams = {}
    #image?: ImageBitmap | HTMLImageElement

    async initialize(attributes: TextureParams) {
        const img = attributes.img

        this.attributes = attributes
        if (typeof img === "string") {
            if (img.includes("data:image/")) {
                this.#image = <ImageBitmap | undefined>await ImageProcessor.request(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: img})
                this.attributes.height = this.#image.height
                this.attributes.width = this.#image.width
                this.texture = this.#initializeTexture()
            } else {
                const i = new Image()
                i.src = img
                await i.decode()
                this.#image = i
                this.attributes.height = i.naturalHeight
                this.attributes.width = i.naturalWidth
                this.texture = this.#initializeTexture()
            }
        } else {
            this.attributes.height = img.height
            this.attributes.width = img.width
            this.#image = img
        }
        this.texture = this.#initializeTexture()
        this.loaded = true
        this.attributes = {}
    }

    #initializeTexture(): WebGLTexture | undefined {
        const {
            wrapS = TEXTURE_WRAPPING.REPEAT,
            wrapT = TEXTURE_WRAPPING.REPEAT,
            minFilter = TEXTURE_FILTERING.MIN.LINEAR_MIPMAP_LINEAR,
            magFilter = TEXTURE_FILTERING.MAG.LINEAR,
            internalFormat = TEXTURE_FORMATS.SRGBA.internalFormat,
            format = TEXTURE_FORMATS.SRGBA.format,
            width,
            height,
            type = "UNSIGNED_BYTE"
        } = this.attributes

        let newTexture = GPU.context.createTexture()

        GPU.context.bindTexture(GPU.context.TEXTURE_2D, newTexture)
        GPU.context.texImage2D(GPU.context.TEXTURE_2D, 0, GPU.context[internalFormat], width, height, 0, GPU.context[format], GPU.context[type], this.#image)

        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MIN_FILTER, GPU.context[minFilter])
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MAG_FILTER, GPU.context[magFilter])

        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_S, GPU.context[wrapS]);
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_T, GPU.context[wrapT]);

        if (minFilter === TEXTURE_FILTERING.MIN.LINEAR_MIPMAP_LINEAR) {
            const anisotropicEXT = GPU.context.getExtension("EXT_texture_filter_anisotropic")
            const anisotropicAmountMin = 8
            const anisotropicAmount = Math.min(anisotropicAmountMin, GPU.context.getParameter(anisotropicEXT.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
            GPU.context.texParameterf(GPU.context.TEXTURE_2D, anisotropicEXT.TEXTURE_MAX_ANISOTROPY_EXT, anisotropicAmount)
            GPU.context.generateMipmap(GPU.context.TEXTURE_2D)
        }

        GPU.context.bindTexture(GPU.context.TEXTURE_2D, null)
        return newTexture
    }

    update(newImage: string) {
        if (this.loaded) {
            GPU.context.deleteTexture(this.texture)
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
        const texture = GPU.context.createTexture()

        GPU.context.bindTexture(GPU.context.TEXTURE_2D, texture)
        GPU.context.texImage2D(GPU.context.TEXTURE_2D, 0, internalFormat, width, height, border, format, type, data)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MAG_FILTER, magFilter)
        GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_MIN_FILTER, minFilter)

        if (wrapS !== undefined)
            GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_S, wrapS)
        if (wrapT !== undefined)
            GPU.context.texParameteri(GPU.context.TEXTURE_2D, GPU.context.TEXTURE_WRAP_T, wrapT)
        if (yFlip === true) GPU.context.pixelStorei(GPU.context.UNPACK_FLIP_Y_WEBGL, false)
        if (autoUnbind)
            GPU.context.bindTexture(GPU.context.TEXTURE_2D, null)

        return texture
    }

}
