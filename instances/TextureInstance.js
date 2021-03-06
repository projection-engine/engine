import IMAGE_WORKER_ACTIONS from "../data/IMAGE_WORKER_ACTIONS"

export default class TextureInstance {
    loaded = false

    constructor(
        img,
        yFlip,
    
        internalFormat,
        format,
        repeat,
        noMipMapping,
        type,
        width,
        height,
        border,
        onLoad
    ) {
        this.attributes = {yFlip, internalFormat, format, repeat, noMipMapping, type, width, height, border,}

        const init = (res) => this.#init(res, yFlip,  internalFormat, format, repeat, noMipMapping, type, width, height, border, onLoad)
        if (typeof img === "string") {

            if (img.includes("data:image/"))
                window.imageWorker(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: img})
                    .then(res => {
                        res.naturalHeight = res.height
                        res.naturalWidth = res.width
                        init(res)
                    })
            else {
                const i = new Image()
                i.src = img
                i.decode().then(() => init(i))
            }
        } else
            init(img)
    }

    #init(
        img,
        yFlip,
        internalFormat = window.gpu.SRGB8_ALPHA8,
        format = window.gpu.RGBA,
        repeat = false,
        noMipMapping = false,
        type = window.gpu.UNSIGNED_BYTE,
        width,
        height,
        border = 0,
        onLoad=()=>null
    ) {
        const gpu = window.gpu
        const anisotropicEXT = gpu.getExtension("EXT_texture_filter_anisotropic")
        let newTexture = gpu.createTexture()
        if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true)

        gpu.bindTexture(gpu.TEXTURE_2D, newTexture)
        gpu.texImage2D(
            gpu.TEXTURE_2D,
            0, internalFormat, width ? width : img.naturalWidth, height ? height : img.naturalHeight, border, format, type, img)

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR)
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR_MIPMAP_LINEAR)

        if (anisotropicEXT && !noMipMapping) {
            const anisotropicAmountMin = 8
            const anisotropicAmount = Math.min(anisotropicAmountMin, gpu.getParameter(anisotropicEXT.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
            gpu.texParameterf(gpu.TEXTURE_2D, anisotropicEXT.TEXTURE_MAX_ANISOTROPY_EXT, anisotropicAmount)
        }
        if (!noMipMapping)
            gpu.generateMipmap(gpu.TEXTURE_2D)

        gpu.bindTexture(gpu.TEXTURE_2D, null)

        this.texture = newTexture

        this.loaded = true
        onLoad()
    }

    update(newImage) {
        if (this.loaded) {
            window.gpu.deleteTexture(this.texture)
            window.imageWorker(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: newImage}).then(res => {
                this.#init(
                    res,
                    this.attributes.yFlip,
                    this.attributes.internalFormat,
                    this.attributes.format,
                    this.attributes.repeat,
                    this.attributes.noMipMapping,
                    this.attributes.type,
                    this.attributes.width,
                    this.attributes.height,
                    this.attributes.border
                )
            })
        }
    }
}
