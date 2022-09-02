import IMAGE_WORKER_ACTIONS from "../../data/IMAGE_WORKER_ACTIONS"
import GPU from "../GPU";

export default class TextureInstance {
    loaded = false
    texture
    attributes = {}

    async initialize(attributes) {
        const img = attributes.img
        this.attributes = attributes
        if (typeof img === "string") {
            if (img.includes("data:image/")) {
                const res = await GPU.imageWorker(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: img})
                res.naturalHeight = res.height
                res.naturalWidth = res.width
                this.attributes.img = res
                this.texture = TextureInstance.#initializeTexture(this.attributes)
            } else {
                const i = new Image()
                i.src = img
                await i.decode()
                this.attributes.img = i
                this.texture = TextureInstance.#initializeTexture(this.attributes)
            }
        } else
            this.texture = TextureInstance.#initializeTexture(this.attributes)
        this.loaded = true
    }

    static #initializeTexture(attributes) {
        const {
            img,
            yFlip,
            internalFormat = gpu.SRGB8_ALPHA8,
            format = gpu.RGBA,
            repeat = false,
            noMipMapping = false,
            type = gpu.UNSIGNED_BYTE,
            width,
            height,
            border = 0,
            onLoad = () => null
        } = attributes

        const anisotropicEXT = gpu.getExtension("EXT_texture_filter_anisotropic")
        let newTexture = gpu.createTexture()
        gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, !yFlip)
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
        onLoad()
        return newTexture
    }

    update(newImage) {
        if (this.loaded) {
            gpu.deleteTexture(this.texture)
            GPU.imageWorker(IMAGE_WORKER_ACTIONS.IMAGE_BITMAP, {base64: newImage}).then(res => {
                this.attributes.img = res
                TextureInstance.#initializeTexture(this.attributes)
            })
        }
    }
}
