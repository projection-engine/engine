export default class TextureInstance {
    loaded = false

    constructor(
        img,
        yFlip,
        gpu,
        internalFormat,
        format,
        repeat,
        noMipMapping,
        type,
        width,
        height,
        border
    ) {

        this.attributes = {
            yFlip,
            internalFormat,
            format,
            repeat,
            noMipMapping,
            type,
            width,
            height,
            border,
        }

        if (typeof img === 'string') {
            const i = new Image()
            i.src = img
            i.onload = () => {
                this._init(
                    i,
                    yFlip,
                    gpu,
                    internalFormat,
                    format,
                    repeat,
                    noMipMapping,
                    type,
                    width,
                    height,
                    border
                )
            }
        } else
            this._init(
                img,
                yFlip,
                gpu,
                internalFormat,
                format,
                repeat,
                noMipMapping,
                type,
                width,
                height,
                border
            )


    }

    _init(
        img,
        yFlip,
        gpu,
        internalFormat = gpu.SRGB8_ALPHA8,
        format = gpu.RGBA,
        repeat = false,
        noMipMapping = false,
        type = gpu.UNSIGNED_BYTE,
        width,
        height,
        border = 0
    ) {
        const anisotropicEXT = gpu.getExtension('EXT_texture_filter_anisotropic')
        let newTexture = gpu.createTexture()
        if (yFlip === true) gpu.pixelStorei(gpu.UNPACK_FLIP_Y_WEBGL, true);

        gpu.bindTexture(gpu.TEXTURE_2D, newTexture);
        gpu.texImage2D(
            gpu.TEXTURE_2D,
            0,
            internalFormat,

            width ? width : img.naturalWidth,
            height ? height : img.naturalHeight,
            border,

            format,
            type,
            img
        )

        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MAG_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR);
        gpu.texParameteri(gpu.TEXTURE_2D, gpu.TEXTURE_MIN_FILTER, repeat ? gpu.REPEAT : gpu.LINEAR_MIPMAP_LINEAR);

        if (anisotropicEXT && !noMipMapping) {
            const anisotropicAmountMin = 8
            const anisotropicAmount = Math.min(anisotropicAmountMin, gpu.getParameter(anisotropicEXT.MAX_TEXTURE_MAX_ANISOTROPY_EXT))
            gpu.texParameterf(gpu.TEXTURE_2D, anisotropicEXT.TEXTURE_MAX_ANISOTROPY_EXT, anisotropicAmount);
        }
        if (!noMipMapping)
            gpu.generateMipmap(gpu.TEXTURE_2D);

        gpu.bindTexture(gpu.TEXTURE_2D, null);

        this.texture = newTexture

        this.loaded = true
    }

    update(newImage, gpu) {

        if (this.loaded) {
            const img = new Image()
            img.src = newImage
            img.onload = () => {
                gpu.bindTexture(gpu.TEXTURE_2D, this.texture);
                gpu.texImage2D(
                    gpu.TEXTURE_2D,
                    0,
                    this.attributes.internalFormat,

                    img.naturalWidth,
                    img.naturalHeight,
                    this.attributes.border,

                    this.attributes.format,
                    this.attributes.type,
                    img
                )
                gpu.generateMipmap(gpu.TEXTURE_2D);

            }
        }
    }
}
