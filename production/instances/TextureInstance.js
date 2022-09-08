import IMAGE_WORKER_ACTIONS from "../data/IMAGE_WORKER_ACTIONS"
import GPU from "../GPU";
import TEXTURE_WRAPPING from "../data/texture/TEXTURE_WRAPPING";
import TEXTURE_FILTERING from "../data/texture/TEXTURE_FILTERING";
import TEXTURE_FORMATS from "../data/texture/TEXTURE_FORMATS";

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
            yFlip = false,

            wrapS=TEXTURE_WRAPPING.REPEAT,
            wrapT=TEXTURE_WRAPPING.REPEAT,
            minFilter =  TEXTURE_FILTERING.MIN.LINEAR_MIPMAP_LINEAR,
            magFilter =  TEXTURE_FILTERING.MAG.LINEAR,

            internalFormat = TEXTURE_FORMATS.SRGBA.internalFormat,
            format =  TEXTURE_FORMATS.SRGBA.format,

            width = img.naturalWidth,
            height = img.naturalHeight
        } = attributes


        let newTexture = gpu.createTexture()

        if(yFlip)
            gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true)

        gpu.bindTexture(gpu.TEXTURE_2D, newTexture)
        gpu.texImage2D(gpu.TEXTURE_2D, 0, gpu[internalFormat], width, height, 0, gpu[format], gpu.UNSIGNED_BYTE, img)

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, gpu[minFilter])
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, gpu[magFilter])

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_S, gpu[wrapS]);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_WRAP_T, gpu[wrapT]);

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
